package com.lms.dev.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.dev.dto.CheckoutSessionResponse;
import com.lms.dev.dto.EnrollRequest;
import com.lms.dev.dto.PaymentConfirmation;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.CoursePayment;
import com.lms.dev.entity.User;
import com.lms.dev.repository.CoursePaymentRepository;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class CashfreePaymentService {
    private static final String CURRENCY = "INR";
    private static final String PENDING = "PENDING";
    private static final String PAID = "PAID";
    private static final String API_VERSION = "2023-08-01";

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CoursePaymentRepository paymentRepository;
    private final LearningRepository learningRepository;
    private final LearningService learningService;
    private final ObjectMapper objectMapper;
    private final RestClient cashfreeClient;

    @Value("${app.payments.cashfree-client-id:}")
    private String clientId;

    @Value("${app.payments.cashfree-client-secret:}")
    private String clientSecret;

    @Value("${app.payments.cashfree-environment:sandbox}")
    private String environment;

    @Value("${app.payments.mode:demo}")
    private String paymentMode;

    @Value("${app.payments.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public CashfreePaymentService(CourseRepository courseRepository, UserRepository userRepository,
            CoursePaymentRepository paymentRepository, LearningRepository learningRepository,
            LearningService learningService, ObjectMapper objectMapper) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.learningRepository = learningRepository;
        this.learningService = learningService;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(15));
        this.cashfreeClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    public CheckoutSessionResponse createCheckoutSession(UUID userId, UUID courseId, String customerPhone) {
        if (courseId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a course to purchase");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (course.getPrice() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This course does not require payment");
        }
        if (learningRepository.findByUserAndCourse(user, course) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already enrolled in this course");
        }

        String orderId = "order_" + UUID.randomUUID().toString().replace("-", "");
        String frontendBaseUrl = frontendUrl.replaceAll("/+$", "");
        if ("demo".equalsIgnoreCase(paymentMode)) {
            savePendingPayment(user, course, orderId);
            return new CheckoutSessionResponse(
                    orderId, null, "demo", frontendBaseUrl + "/payment/demo?order_id=" + orderId);
        }
        if (!"cashfree".equalsIgnoreCase(paymentMode)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Payment mode must be demo or cashfree");
        }
        requireCashfreeCredentials();
        String normalizedPhone = normalizePhone(customerPhone);
        Map<String, Object> customerDetails = Map.of(
                "customer_id", userId.toString(),
                "customer_email", user.getEmail(),
                "customer_phone", normalizedPhone);
        Map<String, Object> orderMeta = Map.of(
                "return_url", frontendBaseUrl + "/payment/success?order_id={order_id}");
        Map<String, Object> orderRequest = new HashMap<>();
        orderRequest.put("order_id", orderId);
        orderRequest.put("order_amount", BigDecimal.valueOf(course.getPrice()));
        orderRequest.put("order_currency", CURRENCY);
        orderRequest.put("customer_details", customerDetails);
        orderRequest.put("order_meta", orderMeta);
        orderRequest.put("order_note", course.getCourse_name());

        JsonNode cashfreeOrder = cashfreeRequest(() -> cashfreeClient.post()
                .uri(cashfreeBaseUrl() + "/orders")
                .headers(this::setCashfreeHeaders)
                .contentType(MediaType.APPLICATION_JSON)
                .body(orderRequest)
                .retrieve()
                .body(JsonNode.class));
        String paymentSessionId = cashfreeOrder == null
                ? null : cashfreeOrder.path("payment_session_id").asText(null);
        String returnedOrderId = cashfreeOrder == null ? null : cashfreeOrder.path("order_id").asText(null);
        if (paymentSessionId == null || paymentSessionId.isBlank() || !orderId.equals(returnedOrderId)) {
            log.error("Cashfree returned an invalid order response for course {}.", courseId);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not start secure checkout");
        }

        savePendingPayment(user, course, orderId);
        return new CheckoutSessionResponse(orderId, paymentSessionId, normalizedEnvironment(), null);
    }

    @Transactional
    public PaymentConfirmation confirmCheckout(UUID userId, String orderId) {
        validateOrderId(orderId);
        if ("demo".equalsIgnoreCase(paymentMode)) {
            return confirmDemoPayment(userId, orderId);
        }
        if (!"cashfree".equalsIgnoreCase(paymentMode)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Payment mode must be demo or cashfree");
        }
        requireCashfreeCredentials();
        JsonNode cashfreeOrder = fetchOrder(orderId);
        return fulfillPaidOrder(cashfreeOrder, userId);
    }

    @Transactional
    public void handleWebhook(String payload, String signature, String timestamp) {
        if (!"cashfree".equalsIgnoreCase(paymentMode)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Cashfree webhooks are unavailable in demo payment mode");
        }
        requireCashfreeCredentials();
        verifyWebhookSignature(payload, signature, timestamp);
        JsonNode event;
        try {
            event = objectMapper.readTree(payload);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Cashfree webhook payload");
        }

        String orderId = event.path("data").path("order").path("order_id").asText(null);
        String paymentStatus = event.path("data").path("payment").path("payment_status").asText();
        if (orderId == null || !"SUCCESS".equalsIgnoreCase(paymentStatus)) {
            return;
        }
        fulfillPaidOrder(fetchOrder(orderId), null);
    }

    @Transactional
    public PaymentConfirmation fulfillPaidOrder(JsonNode cashfreeOrder, UUID requestingUserId) {
        String orderId = cashfreeOrder == null ? null : cashfreeOrder.path("order_id").asText(null);
        validateOrderId(orderId);
        CoursePayment payment = paymentRepository.findByPaymentOrderIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment order not found"));
        UUID userId = payment.getUser().getId();
        UUID courseId = payment.getCourse().getCourse_id();
        if (requestingUserId != null && !requestingUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This payment order belongs to another user");
        }
        if (PAID.equals(payment.getStatus())) {
            return new PaymentConfirmation(PAID, courseId);
        }
        if (!PAID.equalsIgnoreCase(cashfreeOrder.path("order_status").asText())) {
            return new PaymentConfirmation(PENDING, courseId);
        }
        long amountMinor;
        try {
            amountMinor = cashfreeOrder.path("order_amount").decimalValue()
                    .movePointRight(2).longValueExact();
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cashfree payment amount is invalid");
        }
        if (amountMinor != payment.getAmountMinor()
                || !payment.getCurrency().equalsIgnoreCase(cashfreeOrder.path("order_currency").asText())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cashfree payment amount does not match");
        }

        payment.setStatus(PAID);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.saveAndFlush(payment);
        learningService.enrollCourse(new EnrollRequest(userId, courseId));
        return new PaymentConfirmation(PAID, courseId);
    }

    @Transactional
    public PaymentConfirmation confirmDemoPayment(UUID userId, String orderId) {
        CoursePayment payment = paymentRepository.findByPaymentOrderIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment order not found"));
        UUID paymentUserId = payment.getUser().getId();
        UUID courseId = payment.getCourse().getCourse_id();
        if (!paymentUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This payment order belongs to another user");
        }
        if (PAID.equals(payment.getStatus())) {
            return new PaymentConfirmation(PAID, courseId);
        }
        payment.setStatus(PAID);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.saveAndFlush(payment);
        learningService.enrollCourse(new EnrollRequest(paymentUserId, courseId));
        return new PaymentConfirmation(PAID, courseId);
    }

    private void savePendingPayment(User user, Course course, String orderId) {
        CoursePayment payment = new CoursePayment();
        payment.setUser(user);
        payment.setCourse(course);
        payment.setPaymentOrderId(orderId);
        payment.setAmountMinor(Math.multiplyExact((long) course.getPrice(), 100L));
        payment.setCurrency(CURRENCY);
        payment.setStatus(PENDING);
        paymentRepository.save(payment);
    }

    private JsonNode fetchOrder(String orderId) {
        return cashfreeRequest(() -> cashfreeClient.get()
                .uri(cashfreeBaseUrl() + "/orders/{orderId}", orderId)
                .headers(this::setCashfreeHeaders)
                .retrieve()
                .body(JsonNode.class));
    }

    private void verifyWebhookSignature(String payload, String signature, String timestamp) {
        if (payload == null || signature == null || signature.isBlank()
                || timestamp == null || timestamp.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing Cashfree webhook signature");
        }
        byte[] supplied;
        try {
            supplied = Base64.getDecoder().decode(signature);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Cashfree webhook signature");
        }
        byte[] expected = calculateWebhookSignature(timestamp + payload);
        if (!MessageDigest.isEqual(expected, supplied)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Cashfree webhook signature");
        }
    }

    private byte[] calculateWebhookSignature(String signedPayload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(clientSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(signedPayload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not verify Cashfree webhook signature", exception);
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a mobile number for payment");
        }
        String normalizedPhone = phone.replaceAll("\\D", "");
        if (!normalizedPhone.matches("\\d{10,15}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid mobile number (10–15 digits)");
        }
        return normalizedPhone;
    }

    private void validateOrderId(String orderId) {
        if (orderId == null || !orderId.matches("order_[A-Za-z0-9_-]{1,50}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Cashfree order");
        }
    }

    private void requireCashfreeCredentials() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Cashfree payments are not configured");
        }
    }

    private String normalizedEnvironment() {
        if ("sandbox".equalsIgnoreCase(environment)) return "sandbox";
        if ("production".equalsIgnoreCase(environment)) return "production";
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Cashfree environment must be sandbox or production");
    }

    private String cashfreeBaseUrl() {
        return "sandbox".equals(normalizedEnvironment())
                ? "https://sandbox.cashfree.com/pg"
                : "https://api.cashfree.com/pg";
    }

    private void setCashfreeHeaders(HttpHeaders headers) {
        headers.set("x-client-id", clientId);
        headers.set("x-client-secret", clientSecret);
        headers.set("x-api-version", API_VERSION);
    }

    private <T> T cashfreeRequest(java.util.function.Supplier<T> request) {
        try {
            return request.get();
        } catch (RestClientException exception) {
            log.error("Cashfree API request failed.", exception);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Cashfree checkout is temporarily unavailable");
        }
    }
}

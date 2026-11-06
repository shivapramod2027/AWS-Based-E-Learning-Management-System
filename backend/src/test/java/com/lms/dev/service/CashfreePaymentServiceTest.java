package com.lms.dev.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.CoursePayment;
import com.lms.dev.entity.User;
import com.lms.dev.repository.CoursePaymentRepository;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CashfreePaymentServiceTest {
    private CashfreePaymentService paymentService;
    private CoursePaymentRepository payments;
    private LearningService learningService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        payments = mock(CoursePaymentRepository.class);
        learningService = mock(LearningService.class);
        objectMapper = new ObjectMapper();
        paymentService = new CashfreePaymentService(
                mock(CourseRepository.class),
                mock(UserRepository.class),
                payments,
                mock(LearningRepository.class),
                learningService,
                objectMapper);
        ReflectionTestUtils.setField(paymentService, "clientId", "cashfree_test_id");
        ReflectionTestUtils.setField(paymentService, "clientSecret", "cashfree_test_secret");
        ReflectionTestUtils.setField(paymentService, "paymentMode", "cashfree");
    }

    @Test
    void enrollsOnlyAfterCashfreeConfirmsExpectedAmount() {
        UUID userId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        CoursePayment payment = payment(userId, courseId);
        when(payments.findByPaymentOrderIdForUpdate("order_test123"))
                .thenReturn(Optional.of(payment));

        var result = paymentService.fulfillPaidOrder(order(1500), null);

        assertEquals("PAID", result.status());
        assertEquals(courseId, result.courseId());
        assertEquals("PAID", payment.getStatus());
        verify(payments).saveAndFlush(payment);
        verify(learningService).enrollCourse(any());
    }

    @Test
    void rejectsCashfreeAmountThatDoesNotMatchTheSavedCoursePrice() {
        UUID userId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        CoursePayment payment = payment(userId, courseId);
        when(payments.findByPaymentOrderIdForUpdate("order_test123"))
                .thenReturn(Optional.of(payment));

        assertThrows(ResponseStatusException.class,
                () -> paymentService.fulfillPaidOrder(order(1), null));

        assertEquals("PENDING", payment.getStatus());
        verify(payments, never()).saveAndFlush(any());
        verify(learningService, never()).enrollCourse(any());
    }

    @Test
    void demoPaymentConfirmsOnlyTheSignedInUsersOrder() {
        UUID userId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        CoursePayment payment = payment(userId, courseId);
        when(payments.findByPaymentOrderIdForUpdate("order_test123"))
                .thenReturn(Optional.of(payment));
        ReflectionTestUtils.setField(paymentService, "paymentMode", "demo");

        var result = paymentService.confirmCheckout(userId, "order_test123");

        assertEquals("PAID", result.status());
        assertEquals(courseId, result.courseId());
        assertEquals("PAID", payment.getStatus());
        verify(payments).saveAndFlush(payment);
        verify(learningService).enrollCourse(any());
    }

    @Test
    void demoPaymentRejectsAnotherUsersOrder() {
        UUID userId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        CoursePayment payment = payment(userId, courseId);
        when(payments.findByPaymentOrderIdForUpdate("order_test123"))
                .thenReturn(Optional.of(payment));
        ReflectionTestUtils.setField(paymentService, "paymentMode", "demo");

        assertThrows(ResponseStatusException.class,
                () -> paymentService.confirmCheckout(UUID.randomUUID(), "order_test123"));

        assertEquals("PENDING", payment.getStatus());
        verify(learningService, never()).enrollCourse(any());
    }

    @Test
    void rejectsWebhookWithoutValidCashfreeSignature() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> paymentService.handleWebhook("{}", "invalid", "123"));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void acceptsValidCashfreeWebhookSignature() {
        String payload = "{}";
        String timestamp = "123";
        assertDoesNotThrow(() ->
                paymentService.handleWebhook(payload, signature(timestamp + payload), timestamp));
    }

    private CoursePayment payment(UUID userId, UUID courseId) {
        User user = new User();
        user.setId(userId);
        Course course = new Course();
        course.setCourse_id(courseId);
        CoursePayment payment = new CoursePayment();
        payment.setUser(user);
        payment.setCourse(course);
        payment.setPaymentOrderId("order_test123");
        payment.setAmountMinor(150000);
        payment.setCurrency("INR");
        payment.setStatus("PENDING");
        return payment;
    }

    private ObjectNode order(int amountRupees) {
        ObjectNode order = objectMapper.createObjectNode();
        order.put("order_id", "order_test123");
        order.put("order_status", "PAID");
        order.put("order_amount", amountRupees);
        order.put("order_currency", "INR");
        return order;
    }

    private String signature(String signedPayload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec("cashfree_test_secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(signedPayload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}

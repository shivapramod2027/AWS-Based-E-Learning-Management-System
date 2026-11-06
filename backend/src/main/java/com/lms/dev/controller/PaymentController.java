package com.lms.dev.controller;

import com.lms.dev.dto.CheckoutSessionRequest;
import com.lms.dev.dto.CheckoutSessionResponse;
import com.lms.dev.dto.ConfirmPaymentRequest;
import com.lms.dev.dto.PaymentConfirmation;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.service.CashfreePaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final CashfreePaymentService paymentService;

    @PostMapping("/checkout-session")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public CheckoutSessionResponse createCheckoutSession(
            @RequestBody CheckoutSessionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (request == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Choose a course to purchase");
        }
        return paymentService.createCheckoutSession(
                principal.getId(), request.courseId(), request.customerPhone());
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public PaymentConfirmation confirmCheckout(
            @RequestBody ConfirmPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (request == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Checkout session is required");
        }
        return paymentService.confirmCheckout(principal.getId(), request.orderId());
    }

    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> receiveWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "x-webhook-signature", required = false) String signature,
            @RequestHeader(value = "x-webhook-timestamp", required = false) String timestamp) {
        paymentService.handleWebhook(payload, signature, timestamp);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}

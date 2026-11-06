package com.lms.dev.dto;

import java.util.UUID;

public record CheckoutSessionResponse(String orderId, String paymentSessionId, String mode, String checkoutUrl,
        UUID courseId, String courseName, int amount, String currency) {
}

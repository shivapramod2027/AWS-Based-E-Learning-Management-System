package com.lms.dev.dto;

public record CheckoutSessionResponse(String orderId, String paymentSessionId, String mode, String checkoutUrl) {
}

package com.lms.dev.dto;

import java.util.UUID;

public record CheckoutSessionRequest(UUID courseId, String customerPhone) {
}

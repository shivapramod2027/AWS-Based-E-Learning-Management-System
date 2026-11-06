package com.lms.dev.dto;

import java.util.UUID;

public record PaymentConfirmation(String status, UUID courseId) {
}

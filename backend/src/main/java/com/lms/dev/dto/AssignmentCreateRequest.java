package com.lms.dev.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AssignmentCreateRequest(UUID courseId, String title, String description, LocalDateTime dueAt) {
}

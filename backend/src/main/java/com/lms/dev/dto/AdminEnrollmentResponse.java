package com.lms.dev.dto;

import com.lms.dev.entity.Learning;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminEnrollmentResponse(
        UUID id,
        UUID userId,
        String studentName,
        String studentEmail,
        UUID courseId,
        String courseName,
        LocalDateTime enrolledAt
) {
    public static AdminEnrollmentResponse from(Learning learning) {
        return new AdminEnrollmentResponse(
                learning.getId(),
                learning.getUser().getId(),
                learning.getUser().getUsername(),
                learning.getUser().getEmail(),
                learning.getCourse().getCourse_id(),
                learning.getCourse().getCourse_name(),
                learning.getCreatedAt()
        );
    }
}

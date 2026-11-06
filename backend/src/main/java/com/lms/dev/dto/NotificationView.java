package com.lms.dev.dto;

import com.lms.dev.entity.Notification;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationView(UUID id, String type, String title, String message, boolean read,
        LocalDateTime createdAt, UUID assignmentId, UUID courseId) {
    public static NotificationView from(Notification notification) {
        return new NotificationView(notification.getId(), notification.getType(), notification.getTitle(),
                notification.getMessage(), notification.isRead(), notification.getCreatedAt(),
                notification.getAssignment() == null ? null : notification.getAssignment().getId(),
                notification.getCourse() == null ? null : notification.getCourse().getCourse_id());
    }
}

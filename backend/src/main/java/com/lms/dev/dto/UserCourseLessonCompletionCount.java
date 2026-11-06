package com.lms.dev.dto;

import java.util.UUID;

public record UserCourseLessonCompletionCount(UUID userId, UUID courseId, long completedLessons) {
}

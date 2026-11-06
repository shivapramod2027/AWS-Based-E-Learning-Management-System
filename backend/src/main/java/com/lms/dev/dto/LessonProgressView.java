package com.lms.dev.dto;

public record LessonProgressView(long totalLessons, long completedLessons, double progressPercent) {
}

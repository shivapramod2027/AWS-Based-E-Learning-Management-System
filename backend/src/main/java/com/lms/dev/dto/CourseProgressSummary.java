package com.lms.dev.dto;

import java.util.UUID;

public record CourseProgressSummary(UUID courseId, String courseName, long learners,
        long completedLearners, double averageProgressPercent) {
}

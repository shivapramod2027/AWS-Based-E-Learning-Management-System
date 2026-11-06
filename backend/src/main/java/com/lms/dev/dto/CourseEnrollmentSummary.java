package com.lms.dev.dto;

import java.util.UUID;

public record CourseEnrollmentSummary(UUID courseId, String courseName, long enrollments) {
}

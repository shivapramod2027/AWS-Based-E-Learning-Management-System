package com.lms.dev.dto;

import java.util.UUID;

public record CourseLessonCount(UUID courseId, long lessonCount) {
}

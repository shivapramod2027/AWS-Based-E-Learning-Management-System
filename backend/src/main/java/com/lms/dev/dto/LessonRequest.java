package com.lms.dev.dto;

import java.util.List;

public record LessonRequest(String title, String content, String videoUrl, int lessonOrder,
        Integer durationMinutes, List<LessonResourceRequest> resources) {
}

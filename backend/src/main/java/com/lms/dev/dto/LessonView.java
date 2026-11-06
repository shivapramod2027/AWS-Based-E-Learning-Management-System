package com.lms.dev.dto;

import com.lms.dev.entity.Lesson;

import java.util.List;
import java.util.UUID;

public record LessonView(UUID id, String title, String content, String videoUrl,
        int lessonOrder, Integer durationMinutes, boolean completed, List<LessonResourceView> resources) {
    public static LessonView from(Lesson lesson, boolean completed) {
        return new LessonView(lesson.getId(), lesson.getTitle(), lesson.getContent(), lesson.getVideoUrl(),
                lesson.getLessonOrder(), lesson.getDurationMinutes(), completed,
                lesson.getResources().stream().map(LessonResourceView::from).toList());
    }
}

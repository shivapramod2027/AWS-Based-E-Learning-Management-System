package com.lms.dev.dto;

import com.lms.dev.entity.Progress;

import java.util.UUID;

public record StudentCourseProgress(UUID courseId, String courseName, double progressPercent,
        boolean completed, float playedTime, float duration) {
    public static StudentCourseProgress from(Progress progress) {
        float duration = progress.getDuration();
        float played = progress.getPlayedTime();
        double percent = duration > 0 ? Math.min(100.0, played * 100.0 / duration) : 0;
        return new StudentCourseProgress(progress.getCourse().getCourse_id(),
                progress.getCourse().getCourse_name(), percent, duration > 0 && played >= duration,
                played, duration);
    }
}

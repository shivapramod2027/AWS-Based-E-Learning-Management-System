package com.lms.dev.dto;

import com.lms.dev.entity.LessonResource;

import java.util.UUID;

public record LessonResourceView(UUID id, String title, String url) {
    public static LessonResourceView from(LessonResource resource) {
        return new LessonResourceView(resource.getId(), resource.getTitle(), resource.getUrl());
    }
}

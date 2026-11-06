package com.lms.dev.dto;

import com.lms.dev.entity.CourseModule;

import java.util.List;
import java.util.UUID;

public record CourseModuleView(UUID id, String title, String description, int moduleOrder,
        List<LessonView> lessons) {
    public static CourseModuleView from(CourseModule module, List<LessonView> lessons) {
        return new CourseModuleView(module.getId(), module.getTitle(), module.getDescription(),
                module.getModuleOrder(), lessons);
    }
}

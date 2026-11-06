package com.lms.dev.controller;

import com.lms.dev.dto.CourseModuleView;
import com.lms.dev.dto.LessonProgressView;
import com.lms.dev.dto.LessonCompletionResult;
import com.lms.dev.dto.LessonRequest;
import com.lms.dev.dto.LessonView;
import com.lms.dev.dto.ModuleRequest;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.service.CourseContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CourseContentController {
    private final CourseContentService contentService;

    @GetMapping("/api/courses/{courseId}/modules")
    public List<CourseModuleView> getModules(@PathVariable UUID courseId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return contentService.getModules(courseId, principal == null ? null : principal.getId());
    }

    @GetMapping("/api/courses/{courseId}/lesson-progress")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public LessonProgressView getProgress(@PathVariable UUID courseId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return contentService.getProgress(courseId, principal.getId());
    }

    @PostMapping("/api/courses/{courseId}/modules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseModuleView> createModule(@PathVariable UUID courseId,
            @RequestBody ModuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contentService.createModule(courseId, request));
    }

    @PutMapping("/api/modules/{moduleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseModuleView updateModule(@PathVariable UUID moduleId, @RequestBody ModuleRequest request) {
        return contentService.updateModule(moduleId, request);
    }

    @DeleteMapping("/api/modules/{moduleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteModule(@PathVariable UUID moduleId) {
        contentService.deleteModule(moduleId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/modules/{moduleId}/lessons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LessonView> createLesson(@PathVariable UUID moduleId, @RequestBody LessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contentService.createLesson(moduleId, request));
    }

    @PutMapping("/api/lessons/{lessonId}")
    @PreAuthorize("hasRole('ADMIN')")
    public LessonView updateLesson(@PathVariable UUID lessonId, @RequestBody LessonRequest request) {
        return contentService.updateLesson(lessonId, request);
    }

    @DeleteMapping("/api/lessons/{lessonId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLesson(@PathVariable UUID lessonId) {
        contentService.deleteLesson(lessonId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/lessons/{lessonId}/complete")
    @PreAuthorize("hasRole('USER')")
    public LessonCompletionResult completeLesson(@PathVariable UUID lessonId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return contentService.completeLesson(lessonId, principal.getId());
    }
}

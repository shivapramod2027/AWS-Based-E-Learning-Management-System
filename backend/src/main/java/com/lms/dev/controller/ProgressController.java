package com.lms.dev.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.lms.dev.dto.ProgressRequest;
import com.lms.dev.dto.ProgressMetrics;
import com.lms.dev.dto.CourseProgressSummary;
import com.lms.dev.dto.StudentCourseProgress;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.service.ProgressService;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    @Autowired
    private ProgressService progressService;

    @GetMapping("/stats/completed")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public long getCompletedCourseCount() {
        return progressService.getCompletedCourseCount();
    }

    @GetMapping("/stats/active-learners")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public long getActiveLearnerCount() {
        return progressService.getActiveLearnerCount();
    }

    @GetMapping("/stats")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ProgressMetrics getProgressMetrics() {
        return progressService.getProgressMetrics();
    }

    @GetMapping("/stats/by-course")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public java.util.List<CourseProgressSummary> getCourseProgressSummaries() {
        return progressService.getCourseProgressSummaries();
    }

    @GetMapping("/mine")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('USER')")
    public java.util.List<StudentCourseProgress> getMyProgress(@AuthenticationPrincipal UserPrincipal principal) {
        return progressService.getStudentProgress(principal.getId());
    }

    @GetMapping("/{userId}/{courseId}")
    public ResponseEntity<Float> getProgress(
            @PathVariable UUID userId,
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isOwnerOrAdmin(userId, principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(progressService.getProgress(userId, courseId));
    }

    @PutMapping("/update-progress")
    public ResponseEntity<String> updateProgress(
            @RequestBody ProgressRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isOwnerOrAdmin(request.getUserId(), principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You cannot update another user's progress");
        }
        if (!isAdmin(principal)) {
            request.setUserId(principal.getId());
        }
        return progressService.updateProgress(request);
    }
    
    @PutMapping("/update-duration")
    public ResponseEntity<String> updateDuration(
            @RequestBody ProgressRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isOwnerOrAdmin(request.getUserId(), principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You cannot update another user's progress");
        }
        if (!isAdmin(principal)) {
            request.setUserId(principal.getId());
        }
        return progressService.updateDuration(request);
    }

    private boolean isOwnerOrAdmin(UUID userId, UserPrincipal principal) {
        return isAdmin(principal) || principal.getId().equals(userId);
    }

    private boolean isAdmin(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
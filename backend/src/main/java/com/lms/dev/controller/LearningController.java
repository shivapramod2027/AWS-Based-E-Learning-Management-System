package com.lms.dev.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.lms.dev.dto.EnrollRequest;
import com.lms.dev.dto.CourseEnrollmentSummary;
import com.lms.dev.dto.AdminEnrollmentResponse;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.Learning;
import com.lms.dev.service.LearningService;
import com.lms.dev.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning")
public class LearningController {

    @Autowired
    private LearningService learningService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Course>> getLearningCourses(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isAdmin(principal) && !principal.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(learningService.getLearningCourses(userId));
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminEnrollmentResponse> getEnrollments() {
        return learningService.getEnrollments().stream().map(AdminEnrollmentResponse::from).toList();
    }

    @GetMapping("/stats/by-course")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CourseEnrollmentSummary> getEnrollmentSummary() {
        return learningService.getEnrollmentSummary();
    }

    @PostMapping
    public ResponseEntity<String> enrollCourse(
            @RequestBody EnrollRequest enrollRequest,
            @AuthenticationPrincipal UserPrincipal principal) {
        enrollRequest.setUserId(principal.getId());
        String result = learningService.enrollCourse(enrollRequest);
        if ("Course already enrolled".equals(result)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(result);
        }
        if ("Failed to enroll".equals(result)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> unenrollCourse(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isAdmin(principal) && !learningService.isEnrollmentOwnedBy(id, principal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        learningService.unenrollCourse(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}

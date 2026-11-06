package com.lms.dev.controller;

import com.lms.dev.dto.AssignmentCreateRequest;
import com.lms.dev.dto.AssignmentGradeRequest;
import com.lms.dev.dto.AssignmentSubmissionRequest;
import com.lms.dev.dto.AssignmentSubmissionView;
import com.lms.dev.dto.AssignmentView;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {
    private final AssignmentService assignmentService;

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public List<AssignmentView> getStudentAssignments(@AuthenticationPrincipal UserPrincipal principal) {
        return assignmentService.getStudentAssignments(principal.getId());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AssignmentView> getAllAssignments() {
        return assignmentService.getAllAssignments();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssignmentView> create(@RequestBody AssignmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.create(request));
    }

    @PutMapping("/{assignmentId}/submit")
    @PreAuthorize("hasRole('USER')")
    public AssignmentView submit(@PathVariable UUID assignmentId,
            @RequestBody AssignmentSubmissionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return assignmentService.submit(assignmentId, principal.getId(), request);
    }

    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AssignmentSubmissionView> getSubmissions(@PathVariable UUID assignmentId) {
        return assignmentService.getSubmissions(assignmentId);
    }

    @PutMapping("/submissions/{submissionId}/grade")
    @PreAuthorize("hasRole('ADMIN')")
    public AssignmentSubmissionView grade(@PathVariable UUID submissionId,
            @RequestBody AssignmentGradeRequest request) {
        return assignmentService.grade(submissionId, request);
    }

    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID assignmentId) {
        assignmentService.delete(assignmentId);
        return ResponseEntity.noContent().build();
    }
}

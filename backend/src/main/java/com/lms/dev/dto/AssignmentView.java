package com.lms.dev.dto;

import com.lms.dev.entity.Assignment;
import com.lms.dev.entity.AssignmentSubmission;

import java.time.LocalDateTime;
import java.util.UUID;

public record AssignmentView(
        UUID id,
        UUID courseId,
        String courseName,
        String title,
        String description,
        LocalDateTime dueAt,
        UUID submissionId,
        String submissionContent,
        String submissionUrl,
        Double grade,
        String feedback,
        LocalDateTime submittedAt) {
    public static AssignmentView from(Assignment assignment, AssignmentSubmission submission) {
        return new AssignmentView(
                assignment.getId(),
                assignment.getCourse().getCourse_id(),
                assignment.getCourse().getCourse_name(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getDueAt(),
                submission == null ? null : submission.getId(),
                submission == null ? null : submission.getContent(),
                submission == null ? null : submission.getSubmissionUrl(),
                submission == null ? null : submission.getGrade(),
                submission == null ? null : submission.getFeedback(),
                submission == null ? null : submission.getSubmittedAt());
    }
}

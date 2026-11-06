package com.lms.dev.dto;

import com.lms.dev.entity.AssignmentSubmission;

import java.time.LocalDateTime;
import java.util.UUID;

public record AssignmentSubmissionView(
        UUID id,
        UUID userId,
        String studentName,
        String studentEmail,
        String content,
        String submissionUrl,
        Double grade,
        String feedback,
        LocalDateTime submittedAt) {
    public static AssignmentSubmissionView from(AssignmentSubmission submission) {
        return new AssignmentSubmissionView(
                submission.getId(),
                submission.getUser().getId(),
                submission.getUser().getUsername(),
                submission.getUser().getEmail(),
                submission.getContent(),
                submission.getSubmissionUrl(),
                submission.getGrade(),
                submission.getFeedback(),
                submission.getSubmittedAt());
    }
}

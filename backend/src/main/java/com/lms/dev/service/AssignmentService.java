package com.lms.dev.service;

import com.lms.dev.dto.AssignmentCreateRequest;
import com.lms.dev.dto.AssignmentGradeRequest;
import com.lms.dev.dto.AssignmentSubmissionRequest;
import com.lms.dev.dto.AssignmentSubmissionView;
import com.lms.dev.dto.AssignmentView;
import com.lms.dev.entity.Assignment;
import com.lms.dev.entity.AssignmentSubmission;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.User;
import com.lms.dev.repository.AssignmentRepository;
import com.lms.dev.repository.AssignmentSubmissionRepository;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.NotificationRepository;
import com.lms.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final CourseRepository courseRepository;
    private final LearningRepository learningRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Transactional
    public AssignmentView create(AssignmentCreateRequest request) {
        if (request == null || request.courseId() == null || request.title() == null || request.title().isBlank()
                || request.description() == null || request.description().isBlank()
                || request.title().length() > 255 || request.description().length() > 4000
                || request.dueAt() == null || !request.dueAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a title, description, course, and future due date");
        }
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        Assignment assignment = new Assignment();
        assignment.setCourse(course);
        assignment.setTitle(request.title().trim());
        assignment.setDescription(request.description().trim());
        assignment.setDueAt(request.dueAt());
        Assignment saved = assignmentRepository.save(assignment);
        notificationService.notifyAssignmentCreated(saved);
        return AssignmentView.from(saved, null);
    }

    public List<AssignmentView> getStudentAssignments(UUID userId) {
        User user = getUser(userId);
        List<UUID> courseIds = learningRepository.findAllByUser(user).stream()
                .map(learning -> learning.getCourse().getCourse_id()).toList();
        if (courseIds.isEmpty()) return List.of();
        return assignmentRepository.findForCourseIds(courseIds).stream()
                .map(assignment -> AssignmentView.from(assignment,
                        submissionRepository.findByAssignmentAndUser(assignment, user)))
                .toList();
    }

    public List<AssignmentView> getAllAssignments() {
        return assignmentRepository.findAllByOrderByDueAtAsc().stream()
                .map(assignment -> AssignmentView.from(assignment, null))
                .toList();
    }

    @Transactional
    public AssignmentView submit(UUID assignmentId, UUID userId, AssignmentSubmissionRequest request) {
        Assignment assignment = getAssignment(assignmentId);
        User user = getUser(userId);
        if (learningRepository.findByUserAndCourse(user, assignment.getCourse()) == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enroll in this course before submitting");
        }
        if (!assignment.getDueAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The assignment deadline has passed");
        }
        String content = request == null ? null : request.content();
        String submissionUrl = request == null ? null : request.submissionUrl();
        if ((content == null || content.isBlank()) && (submissionUrl == null || submissionUrl.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Submit written content or a link");
        }
        if (content != null && content.length() > 8000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Written submission is too long");
        }
        if (submissionUrl != null && !submissionUrl.isBlank()) {
            try {
                URI uri = URI.create(submissionUrl.trim());
                String scheme = uri.getScheme();
                if (uri.getHost() == null
                        || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                    throw new IllegalArgumentException("Unsupported URL scheme");
                }
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Submission link must be a valid HTTP or HTTPS URL");
            }
        }
        AssignmentSubmission submission = submissionRepository.findByAssignmentAndUser(assignment, user);
        if (submission == null) {
            submission = new AssignmentSubmission();
            submission.setAssignment(assignment);
            submission.setUser(user);
        }
        submission.setContent(content == null ? null : content.trim());
        submission.setSubmissionUrl(submissionUrl == null ? null : submissionUrl.trim());
        submission.setGrade(null);
        submission.setFeedback(null);
        submission.setSubmittedAt(LocalDateTime.now());
        return AssignmentView.from(assignment, submissionRepository.save(submission));
    }

    public List<AssignmentSubmissionView> getSubmissions(UUID assignmentId) {
        Assignment assignment = getAssignment(assignmentId);
        return submissionRepository.findByAssignmentOrderBySubmittedAtDesc(assignment).stream()
                .map(AssignmentSubmissionView::from).toList();
    }

    @Transactional
    public AssignmentSubmissionView grade(UUID submissionId, AssignmentGradeRequest request) {
        if (request == null || request.grade() == null || request.grade() < 0 || request.grade() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grade must be between 0 and 100");
        }
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        submission.setGrade(request.grade());
        submission.setFeedback(request.feedback());
        return AssignmentSubmissionView.from(submissionRepository.save(submission));
    }

    @Transactional
    public void delete(UUID assignmentId) {
        Assignment assignment = getAssignment(assignmentId);
        List<com.lms.dev.entity.Notification> notifications = notificationRepository.findByAssignment(assignment);
        notifications.forEach(notification -> notification.setAssignment(null));
        notificationRepository.saveAll(notifications);
        submissionRepository.deleteAllByAssignment(assignment);
        assignmentRepository.delete(assignment);
    }

    private Assignment getAssignment(UUID assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}

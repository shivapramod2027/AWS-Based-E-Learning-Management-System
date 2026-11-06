package com.lms.dev.service;

import com.lms.dev.dto.NotificationPreferences;
import com.lms.dev.entity.Assignment;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.Learning;
import com.lms.dev.entity.Notification;
import com.lms.dev.entity.Progress;
import com.lms.dev.entity.User;
import com.lms.dev.repository.AssignmentRepository;
import com.lms.dev.repository.AssignmentSubmissionRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.LessonCompletionRepository;
import com.lms.dev.repository.LessonRepository;
import com.lms.dev.repository.NotificationRepository;
import com.lms.dev.repository.ProgressRepository;
import com.lms.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final LearningRepository learningRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ProgressRepository progressRepository;
    private final EmailNotificationService emailNotificationService;
    private final LessonRepository lessonRepository;
    private final LessonCompletionRepository lessonCompletionRepository;

    public NotificationPreferences getPreferences(UUID userId) {
        User user = getUser(userId);
        return new NotificationPreferences(
                !Boolean.FALSE.equals(user.getDailyRemindersEnabled()),
                user.getPreferredReminderTime() == null ? LocalTime.of(9, 0) : user.getPreferredReminderTime());
    }

    public NotificationPreferences updatePreferences(UUID userId, NotificationPreferences preferences) {
        if (preferences == null || preferences.preferredReminderTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a reminder time");
        }
        User user = getUser(userId);
        user.setDailyRemindersEnabled(preferences.dailyRemindersEnabled());
        user.setPreferredReminderTime(preferences.preferredReminderTime());
        userRepository.save(user);
        return getPreferences(userId);
    }

    public List<Notification> getNotifications(UUID userId) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(getUser(userId));
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserAndReadFalse(getUser(userId));
    }

    public void markRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot update this notification");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void notifyAssignmentCreated(Assignment assignment) {
        for (Learning enrollment : learningRepository.findAllByCourse(assignment.getCourse())) {
            User user = enrollment.getUser();
            String title = "New assignment: " + assignment.getTitle();
            String text = "A new assignment was posted for " + assignment.getCourse().getCourse_name()
                    + ". It is due " + assignment.getDueAt() + ".";
            createNotification(user, assignment, assignment.getCourse(), "ASSIGNMENT", title, text);
            emailNotificationService.send(user, title, text);
        }
    }

    public void notifyCourseUpdated(User user, Course course) {
        String title = "Course updated: " + course.getCourse_name();
        String text = "New course information or materials are available for " + course.getCourse_name() + ".";
        createNotification(user, null, course, "COURSE_UPDATED", title, text);
        emailNotificationService.send(user, title, text);
    }

    public void notifyEnrollment(User user, Course course) {
        String title = "Enrollment confirmed: " + course.getCourse_name();
        String text = "You are enrolled in " + course.getCourse_name()
                + ". Continue your learning from your LearnSphere dashboard.";
        createNotification(user, null, course, "ENROLLMENT", title, text);
        emailNotificationService.send(user, title, text);
    }

    public void notifyWelcome(User user) {
        String title = "Welcome to LearnSphere";
        String text = "Welcome, " + user.getUsername()
                + ". Browse the catalog and enroll in a course to start learning.";
        createNotification(user, null, null, "WELCOME", title, text);
        emailNotificationService.send(user, title, text);
    }

    public void notifyCourseCompleted(User user, Course course) {
        if (notificationRepository.existsByUserAndCourseAndType(user, course, "COURSE_COMPLETED")) return;
        String title = "Course completed: " + course.getCourse_name();
        String text = "Congratulations! You completed " + course.getCourse_name()
                + ". Your completion certificate is ready.";
        createNotification(user, null, course, "COURSE_COMPLETED", title, text);
        emailNotificationService.send(user, title, text);
    }

    public void notifyNewLesson(User user, Course course, String lessonTitle) {
        String title = "New lesson: " + lessonTitle;
        String text = "A new lesson was added to " + course.getCourse_name()
                + ". Continue learning from your dashboard.";
        createNotification(user, null, course, "NEW_LESSON", title, text);
        emailNotificationService.send(user, title, text);
    }

    @Scheduled(cron = "0 * * * * *")
    public void sendDailyLearningReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dayStart = LocalDate.now().atStartOfDay();
        LocalDateTime dayEnd = dayStart.plusDays(1);
        for (User user : userRepository.findByDailyRemindersEnabledTrueAndIsActiveTrue()) {
            LocalTime reminderTime = user.getPreferredReminderTime() == null
                    ? LocalTime.of(9, 0) : user.getPreferredReminderTime();
            if (now.toLocalTime().isBefore(reminderTime)
                    || notificationRepository.existsByUserAndTypeAndCreatedAtBetween(
                            user, "DAILY_REMINDER", dayStart, dayEnd)) {
                continue;
            }
            List<String> incompleteCourses = progressRepository.findAllByUserWithCourse(user).stream()
                    .filter(progress -> {
                        Course course = progress.getCourse();
                        long totalLessons = lessonRepository.countByModule_Course_Course_id(course.getCourse_id());
                        if (totalLessons > 0) {
                            return lessonCompletionRepository.countCompletedByUserAndCourse(
                                    user.getId(), course.getCourse_id()) < totalLessons;
                        }
                        return progress.getDuration() <= 0 || progress.getPlayedTime() < progress.getDuration();
                    })
                    .map(Progress::getCourse)
                    .map(Course::getCourse_name)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
            if (incompleteCourses.isEmpty()) continue;
            String title = "Your daily learning reminder";
            String text = "Keep your momentum going. Continue these courses: "
                    + String.join(", ", incompleteCourses) + ".";
            createNotification(user, null, null, "DAILY_REMINDER", title, text);
            emailNotificationService.send(user, title, text);
        }
    }

    @Scheduled(fixedDelay = 3600000)
    public void notifyUpcomingAssignmentDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        List<Assignment> dueSoon = assignmentRepository.findDueBetween(now, now.plusHours(24));
        for (Assignment assignment : dueSoon) {
            for (Learning enrollment : learningRepository.findAllByCourse(assignment.getCourse())) {
                User user = enrollment.getUser();
                if (!submissionRepository.existsByAssignmentAndUser(assignment, user)
                        && !notificationRepository.existsByUserAndAssignmentAndType(user, assignment, "DUE_SOON")) {
                    String title = "Assignment due soon: " + assignment.getTitle();
                    String text = "This assignment is due within 24 hours for "
                            + assignment.getCourse().getCourse_name() + ".";
                    createNotification(user, assignment, assignment.getCourse(), "DUE_SOON", title, text);
                    emailNotificationService.send(user, title, text);
                }
            }
        }
    }

    private void createNotification(User user, Assignment assignment, Course course,
            String type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAssignment(assignment);
        notification.setCourse(course);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}

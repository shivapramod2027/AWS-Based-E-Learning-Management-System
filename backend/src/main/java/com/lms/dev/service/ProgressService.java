package com.lms.dev.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.lms.dev.dto.ProgressRequest;
import com.lms.dev.dto.ProgressMetrics;
import com.lms.dev.dto.CourseProgressSummary;
import com.lms.dev.dto.CourseLessonCount;
import com.lms.dev.dto.UserCourseLessonCompletionCount;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.Progress;
import com.lms.dev.entity.User;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.ProgressRepository;
import com.lms.dev.repository.UserRepository;
import com.lms.dev.repository.LessonCompletionRepository;
import com.lms.dev.repository.LessonRepository;

import java.util.UUID;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.List;

@RequiredArgsConstructor
@Service
public class ProgressService {

    private final ProgressRepository progressRepository;

    private final UserRepository userRepository;

    private final CourseRepository courseRepository;
    private final NotificationService notificationService;
    private final LessonCompletionRepository lessonCompletionRepository;
    private final LessonRepository lessonRepository;
    private final CertificateService certificateService;

    public ResponseEntity<String> updateProgress(ProgressRequest request) {
        UUID userId = request.getUserId();
        UUID courseId = request.getCourseId();
        float playedTime = request.getPlayedTime();
        float duration = request.getDuration();

        User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);

        if (user != null && course != null) {
            Progress progress = progressRepository.findByUserAndCourse(user, course);
            if (progress != null && (progress.getPlayedTime() == 0 || progress.getPlayedTime()<= playedTime)) {
                boolean wasCompleted = progress.getDuration() > 0
                        && progress.getPlayedTime() >= progress.getDuration();
                progress.setPlayedTime(playedTime);
                progress.setDuration(duration);
                progressRepository.save(progress);
                long totalLessons = lessonRepository.countByModule_Course_Course_id(course.getCourse_id());
                boolean allLessonsCompleted = totalLessons == 0
                        || lessonCompletionRepository.countCompletedByUserAndCourse(userId, courseId) >= totalLessons;
                if (!wasCompleted && duration > 0 && playedTime >= duration && allLessonsCompleted) {
                    notificationService.notifyCourseCompleted(user, course);
                    certificateService.issue(userId, courseId);
                }
                return ResponseEntity.ok("success");
            } else {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Invalid playedTime");
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User or course not found");
    }

	public float getProgress(UUID userId, UUID courseId) {
		User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);

        if (user != null && course != null) {
         Progress progress = progressRepository.findByUserAndCourse(user, course);
         return progress == null ? 0 : progress.getPlayedTime();
        }
		return 0; 
	}

    public long getCompletedCourseCount() {
        ProgressData data = loadProgressData();
        return data.progress.stream().filter(progress -> isCourseCompleted(progress, data)).count();
    }

    public long getActiveLearnerCount() {
        Set<UUID> activeLearners = new LinkedHashSet<>(progressRepository.findActiveLearnerIds());
        activeLearners.addAll(lessonCompletionRepository.findDistinctUserIds());
        return activeLearners.size();
    }

    public ProgressMetrics getProgressMetrics() {
        ProgressData data = loadProgressData();
        long completed = data.progress.stream().filter(progress -> isCourseCompleted(progress, data)).count();
        double averageCompletion = data.progress.isEmpty() ? 0
                : data.progress.stream().mapToDouble(progress -> getProgressPercent(progress, data))
                        .average().orElse(0);
        return new ProgressMetrics(data.progress.size(), completed, averageCompletion);
    }

    public java.util.List<CourseProgressSummary> getCourseProgressSummaries() {
        ProgressData data = loadProgressData();
        Map<UUID, CourseProgressAccumulator> summaries = new LinkedHashMap<>();
        for (Progress progress : data.progress) {
            Course course = progress.getCourse();
            CourseProgressAccumulator summary = summaries.computeIfAbsent(course.getCourse_id(),
                    ignored -> new CourseProgressAccumulator(course.getCourse_id(), course.getCourse_name()));
            summary.learners++;
            summary.completedLearners += isCourseCompleted(progress, data) ? 1 : 0;
            summary.progressTotal += getProgressPercent(progress, data);
        }
        return summaries.values().stream()
                .sorted((first, second) -> Long.compare(second.learners, first.learners))
                .map(summary -> new CourseProgressSummary(
                        summary.courseId, summary.courseName, summary.learners, summary.completedLearners,
                        summary.learners == 0 ? 0 : summary.progressTotal / summary.learners))
                .toList();
    }

    public java.util.List<com.lms.dev.dto.StudentCourseProgress> getStudentProgress(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
        return progressRepository.findAllByUserWithCourse(user).stream()
                .map(progress -> {
                    long totalLessons = lessonRepository.countByModule_Course_Course_id(
                            progress.getCourse().getCourse_id());
                    if (totalLessons == 0) return com.lms.dev.dto.StudentCourseProgress.from(progress);
                    long completedLessons = lessonCompletionRepository.countCompletedByUserAndCourse(
                            userId, progress.getCourse().getCourse_id());
                    return new com.lms.dev.dto.StudentCourseProgress(
                            progress.getCourse().getCourse_id(),
                            progress.getCourse().getCourse_name(),
                            Math.min(100.0, completedLessons * 100.0 / totalLessons),
                            completedLessons >= totalLessons,
                            (float) completedLessons,
                            (float) totalLessons);
                }).toList();
    }

    private ProgressData loadProgressData() {
        Map<UUID, Long> lessonCounts = lessonRepository.findLessonCountsByCourse().stream()
                .collect(java.util.stream.Collectors.toMap(CourseLessonCount::courseId, CourseLessonCount::lessonCount));
        Map<UserCourseKey, Long> completionCounts = lessonCompletionRepository
                .findCompletionCountsByUserAndCourse().stream()
                .collect(java.util.stream.Collectors.toMap(
                        count -> new UserCourseKey(count.userId(), count.courseId()),
                        UserCourseLessonCompletionCount::completedLessons));
        return new ProgressData(progressRepository.findAllWithUserAndCourse(), lessonCounts, completionCounts);
    }

    private boolean isCourseCompleted(Progress progress, ProgressData data) {
        UUID courseId = progress.getCourse().getCourse_id();
        long totalLessons = data.lessonCounts.getOrDefault(courseId, 0L);
        if (totalLessons > 0) {
            return data.completionCounts.getOrDefault(new UserCourseKey(progress.getUser().getId(), courseId), 0L)
                    >= totalLessons;
        }
        return progress.getDuration() > 0 && progress.getPlayedTime() >= progress.getDuration();
    }

    private double getProgressPercent(Progress progress, ProgressData data) {
        UUID courseId = progress.getCourse().getCourse_id();
        long totalLessons = data.lessonCounts.getOrDefault(courseId, 0L);
        if (totalLessons > 0) {
            long completedLessons = data.completionCounts.getOrDefault(
                    new UserCourseKey(progress.getUser().getId(), courseId), 0L);
            return Math.min(100.0, completedLessons * 100.0 / totalLessons);
        }
        if (progress.getDuration() <= 0) return 0;
        return Math.min(100.0, progress.getPlayedTime() * 100.0 / progress.getDuration());
    }

    private record UserCourseKey(UUID userId, UUID courseId) {
    }

    private record ProgressData(List<Progress> progress, Map<UUID, Long> lessonCounts,
            Map<UserCourseKey, Long> completionCounts) {
    }

    private static class CourseProgressAccumulator {
        private final UUID courseId;
        private final String courseName;
        private long learners;
        private long completedLearners;
        private double progressTotal;

        private CourseProgressAccumulator(UUID courseId, String courseName) {
            this.courseId = courseId;
            this.courseName = courseName;
        }
    }

	public ResponseEntity<String> updateDuration(ProgressRequest request) {
        UUID userId = request.getUserId();
        UUID courseId = request.getCourseId();
        float newDuration = request.getDuration();

        User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);

        if (user != null && course != null) {
            Progress progress = progressRepository.findByUserAndCourse(user, course);

            if (progress != null) {
                progress.setDuration(newDuration);
                progressRepository.save(progress);

                return ResponseEntity.ok("Duration updated successfully");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Progress not found for the given user and course");
            }
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User or course not found");
        }
    }

    
}

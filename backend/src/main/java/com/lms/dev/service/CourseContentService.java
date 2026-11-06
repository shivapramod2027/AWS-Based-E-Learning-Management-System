package com.lms.dev.service;

import com.lms.dev.dto.CourseModuleView;
import com.lms.dev.dto.LessonRequest;
import com.lms.dev.dto.LessonView;
import com.lms.dev.dto.LessonProgressView;
import com.lms.dev.dto.ModuleRequest;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.CourseModule;
import com.lms.dev.entity.Lesson;
import com.lms.dev.entity.LessonCompletion;
import com.lms.dev.entity.LessonResource;
import com.lms.dev.entity.User;
import com.lms.dev.repository.CourseModuleRepository;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.LessonCompletionRepository;
import com.lms.dev.repository.LessonRepository;
import com.lms.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseContentService {
    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonCompletionRepository completionRepository;
    private final LearningRepository learningRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<CourseModuleView> getModules(UUID courseId, UUID userId) {
        getCourse(courseId);
        Set<UUID> completedIds = userId == null ? Set.of()
                : completionRepository.findCompletedLessonIds(userId, courseId).stream().collect(Collectors.toSet());
        return moduleRepository.findByCourse_Course_idOrderByModuleOrderAsc(courseId).stream()
                .map(module -> {
                    List<LessonView> lessons = lessonRepository.findByModule_IdOrderByLessonOrderAsc(module.getId())
                            .stream()
                            .map(lesson -> LessonView.from(lesson, completedIds.contains(lesson.getId())))
                            .toList();
                    return CourseModuleView.from(module, lessons);
                }).toList();
    }

    public LessonProgressView getProgress(UUID courseId, UUID userId) {
        getCourse(courseId);
        long total = lessonRepository.countByModule_Course_Course_id(courseId);
        if (total == 0 || userId == null) return new LessonProgressView(total, 0, 0);
        long completed = completionRepository.countCompletedByUserAndCourse(userId, courseId);
        return new LessonProgressView(total, completed, Math.min(100.0, completed * 100.0 / total));
    }

    @Transactional
    public CourseModuleView createModule(UUID courseId, ModuleRequest request) {
        if (request == null || request.title() == null || request.title().isBlank()
                || request.title().length() > 255 || request.moduleOrder() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a module title and a valid order");
        }
        CourseModule module = new CourseModule();
        module.setCourse(getCourse(courseId));
        module.setTitle(request.title().trim());
        module.setDescription(request.description());
        module.setModuleOrder(request.moduleOrder());
        CourseModule saved = moduleRepository.save(module);
        return CourseModuleView.from(saved, List.of());
    }

    @Transactional
    public CourseModuleView updateModule(UUID moduleId, ModuleRequest request) {
        if (request == null || request.title() == null || request.title().isBlank()
                || request.title().length() > 255 || request.moduleOrder() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a module title and a valid order");
        }
        CourseModule module = getModule(moduleId);
        module.setTitle(request.title().trim());
        module.setDescription(request.description());
        module.setModuleOrder(request.moduleOrder());
        CourseModule saved = moduleRepository.save(module);
        return CourseModuleView.from(saved, List.of());
    }

    @Transactional
    public void deleteModule(UUID moduleId) {
        CourseModule module = getModule(moduleId);
        for (Lesson lesson : lessonRepository.findByModule_IdOrderByLessonOrderAsc(moduleId)) {
            completionRepository.deleteByLesson(lesson);
            lessonRepository.delete(lesson);
        }
        moduleRepository.delete(module);
    }

    @Transactional
    public LessonView createLesson(UUID moduleId, LessonRequest request) {
        validateLesson(request);
        CourseModule module = getModule(moduleId);
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        applyLesson(lesson, request);
        Lesson saved = lessonRepository.save(lesson);
        notifyNewLesson(saved);
        return LessonView.from(saved, false);
    }

    @Transactional
    public LessonView updateLesson(UUID lessonId, LessonRequest request) {
        validateLesson(request);
        Lesson lesson = getLesson(lessonId);
        lesson.getResources().clear();
        applyLesson(lesson, request);
        Lesson saved = lessonRepository.save(lesson);
        notifyNewLesson(saved);
        return LessonView.from(saved, false);
    }

    @Transactional
    public void deleteLesson(UUID lessonId) {
        Lesson lesson = getLesson(lessonId);
        completionRepository.deleteByLesson(lesson);
        lessonRepository.delete(lesson);
    }

    @Transactional
    public LessonView completeLesson(UUID lessonId, UUID userId) {
        Lesson lesson = getLesson(lessonId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Course course = lesson.getModule().getCourse();
        if (learningRepository.findByUserAndCourse(user, course) == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enroll in this course to complete lessons");
        }
        if (!completionRepository.existsByLessonAndUser(lesson, user)) {
            LessonCompletion completion = new LessonCompletion();
            completion.setLesson(lesson);
            completion.setUser(user);
            completionRepository.save(completion);
        }
        long totalLessons = lessonRepository.countByModule_Course_Course_id(course.getCourse_id());
        long completedLessons = completionRepository.countCompletedByUserAndCourse(userId, course.getCourse_id());
        if (totalLessons > 0 && completedLessons >= totalLessons) {
            notificationService.notifyCourseCompleted(user, course);
        }
        return LessonView.from(lesson, true);
    }

    private void notifyNewLesson(Lesson lesson) {
        Course course = lesson.getModule().getCourse();
        for (var enrollment : learningRepository.findAllByCourse(course)) {
            notificationService.notifyNewLesson(enrollment.getUser(), course, lesson.getTitle());
        }
    }

    private void applyLesson(Lesson lesson, LessonRequest request) {
        lesson.setTitle(request.title().trim());
        lesson.setContent(request.content());
        lesson.setVideoUrl(request.videoUrl());
        lesson.setLessonOrder(request.lessonOrder());
        lesson.setDurationMinutes(request.durationMinutes());
        if (request.resources() != null) {
            for (var resourceRequest : request.resources()) {
                LessonResource resource = new LessonResource();
                resource.setLesson(lesson);
                resource.setTitle(resourceRequest.title().trim());
                resource.setUrl(resourceRequest.url().trim());
                lesson.getResources().add(resource);
            }
        }
    }

    private void validateLesson(LessonRequest request) {
        if (request == null || request.title() == null || request.title().isBlank()
                || request.title().length() > 255 || request.lessonOrder() < 0
                || (request.content() != null && request.content().length() > 8000)
                || (request.durationMinutes() != null && request.durationMinutes() < 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a valid lesson title, order, and content");
        }
        if (request.videoUrl() != null && !request.videoUrl().isBlank()) validateHttpUrl(request.videoUrl());
        if (request.resources() != null) {
            if (request.resources().size() > 20) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A lesson can have at most 20 resources");
            }
            for (var resource : request.resources()) {
                if (resource == null || resource.title() == null || resource.title().isBlank()
                        || resource.title().length() > 255 || resource.url() == null || resource.url().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each resource needs a title and URL");
                }
                validateHttpUrl(resource.url());
            }
        }
    }

    private void validateHttpUrl(String value) {
        try {
            URI uri = URI.create(value.trim());
            if (uri.getHost() == null || (!"http".equalsIgnoreCase(uri.getScheme())
                    && !"https".equalsIgnoreCase(uri.getScheme()))) {
                throw new IllegalArgumentException("Invalid web URL");
            }
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video and resource URLs must use HTTP or HTTPS");
        }
    }

    private Course getCourse(UUID courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private CourseModule getModule(UUID moduleId) {
        return moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
    }

    private Lesson getLesson(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    }
}

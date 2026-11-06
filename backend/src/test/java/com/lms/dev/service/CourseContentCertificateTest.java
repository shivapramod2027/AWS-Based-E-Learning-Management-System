package com.lms.dev.service;

import com.lms.dev.entity.Course;
import com.lms.dev.entity.CourseModule;
import com.lms.dev.entity.Learning;
import com.lms.dev.entity.Lesson;
import com.lms.dev.entity.User;
import com.lms.dev.dto.CertificateView;
import com.lms.dev.repository.CourseModuleRepository;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.LessonCompletionRepository;
import com.lms.dev.repository.LessonRepository;
import com.lms.dev.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CourseContentCertificateTest {
    @Test
    void issuesCertificateWhenLearnerCompletesFinalLesson() {
        UUID userId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID lessonId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        Course course = new Course();
        course.setCourse_id(courseId);
        CourseModule module = new CourseModule();
        module.setCourse(course);
        Lesson lesson = new Lesson();
        lesson.setId(lessonId);
        lesson.setTitle("Final lesson");
        lesson.setModule(module);

        UserRepository users = mock(UserRepository.class);
        LessonRepository lessons = mock(LessonRepository.class);
        LessonCompletionRepository completions = mock(LessonCompletionRepository.class);
        LearningRepository enrollments = mock(LearningRepository.class);
        CertificateService certificates = mock(CertificateService.class);
        when(lessons.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(enrollments.findByUserAndCourse(user, course)).thenReturn(new Learning());
        when(completions.existsByLessonAndUser(lesson, user)).thenReturn(false);
        when(lessons.countByModule_Course_Course_id(courseId)).thenReturn(1L);
        when(completions.countCompletedByUserAndCourse(userId, courseId)).thenReturn(1L);
        CertificateView certificate = new CertificateView(true, "LS-TEST", "Learner",
                "Course", java.time.LocalDateTime.now());
        when(certificates.issue(userId, courseId)).thenReturn(certificate);

        CourseContentService service = new CourseContentService(
                mock(CourseRepository.class),
                mock(CourseModuleRepository.class),
                lessons,
                completions,
                enrollments,
                users,
                mock(NotificationService.class),
                certificates);

        var result = service.completeLesson(lessonId, userId);

        verify(certificates).issue(userId, courseId);
        verify(completions).save(any());
        org.junit.jupiter.api.Assertions.assertEquals(certificate, result.certificate());
    }
}

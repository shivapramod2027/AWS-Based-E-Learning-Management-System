package com.lms.dev.service;

import com.lms.dev.dto.EnrollRequest;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.User;
import com.lms.dev.repository.CoursePaymentRepository;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.ProgressRepository;
import com.lms.dev.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LearningServicePaymentTest {
    @Test
    void rejectsDirectEnrollmentForUnpaidCourse() {
        UUID userId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        Course course = new Course();
        course.setCourse_id(courseId);
        course.setPrice(1500);

        UserRepository users = mock(UserRepository.class);
        CourseRepository courses = mock(CourseRepository.class);
        LearningRepository enrollments = mock(LearningRepository.class);
        CoursePaymentRepository payments = mock(CoursePaymentRepository.class);
        when(users.findById(userId)).thenReturn(java.util.Optional.of(user));
        when(courses.findById(courseId)).thenReturn(java.util.Optional.of(course));
        when(payments.existsByUserAndCourseAndStatus(user, course, "PAID")).thenReturn(false);

        LearningService learningService = new LearningService(
                enrollments, users, courses, mock(ProgressRepository.class),
                mock(NotificationService.class), payments);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> learningService.enrollCourse(new EnrollRequest(userId, courseId)));

        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatusCode());
        verify(enrollments, never()).save(org.mockito.ArgumentMatchers.any());
    }
}

package com.lms.dev.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.lms.dev.dto.EnrollRequest;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.Learning;
import com.lms.dev.entity.Progress;
import com.lms.dev.entity.User;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.ProgressRepository;
import com.lms.dev.repository.UserRepository;
import com.lms.dev.repository.CoursePaymentRepository;
import com.lms.dev.dto.CourseEnrollmentSummary;
import java.util.*;

@RequiredArgsConstructor
@Service
public class LearningService {

    private final LearningRepository learningRepository;

    private final UserRepository userRepository;

    private final CourseRepository courseRepository;
    
    private final ProgressRepository progressRepository;
    private final NotificationService notificationService;
    private final CoursePaymentRepository paymentRepository;

    public List<Course> getLearningCourses(UUID userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            List<Course> learningCourses = new ArrayList<>();

            if (user.getLearningCourses() != null) {
                for (Learning learning : user.getLearningCourses()) {
                    Course course = learning.getCourse();
                    learningCourses.add(course);
                }
            }

            return learningCourses;
        }

        return Collections.emptyList();
    }
    
    public List<Learning> getEnrollments() {
    	return learningRepository.findAll();
    }

    public List<CourseEnrollmentSummary> getEnrollmentSummary() {
        return learningRepository.findCourseEnrollmentSummary();
    }

    @Transactional
    public String enrollCourse(EnrollRequest enrollRequest) {
        User user = userRepository.findById(enrollRequest.getUserId()).orElse(null);
        Course course = courseRepository.findById(enrollRequest.getCourseId()).orElse(null);

        if (user != null && course != null) {
            if (course.getPrice() > 0
                    && !paymentRepository.existsByUserAndCourseAndStatus(user, course, "PAID")) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.PAYMENT_REQUIRED,
                        "Complete payment before enrolling in this course");
            }
            Learning existingLearning = learningRepository.findByUserAndCourse(user, course);
            if (existingLearning != null) {
                return "Course already enrolled";
            }

            Progress progress = new Progress();
            progress.setUser(user);
            progress.setCourse(course);
            progressRepository.save(progress);

            Learning learning = new Learning();
            learning.setUser(user);
            learning.setCourse(course);
            learningRepository.save(learning);
            notificationService.notifyEnrollment(user, course);

            return "Enrolled successfully";
        }

        return "Failed to enroll";
    }

    public boolean isEnrollmentOwnedBy(UUID enrollmentId, UUID userId) {
        return learningRepository.findById(enrollmentId)
                .map(learning -> learning.getUser().getId().equals(userId))
                .orElse(false);
    }


    public void unenrollCourse(UUID id) {
        learningRepository.deleteById(id);
    }
}

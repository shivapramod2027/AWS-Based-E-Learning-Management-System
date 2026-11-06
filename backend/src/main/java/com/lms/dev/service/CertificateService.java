package com.lms.dev.service;

import com.lms.dev.dto.CertificateView;
import com.lms.dev.entity.Certificate;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.Learning;
import com.lms.dev.entity.Progress;
import com.lms.dev.entity.User;
import com.lms.dev.repository.CertificateRepository;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.LessonCompletionRepository;
import com.lms.dev.repository.LessonRepository;
import com.lms.dev.repository.ProgressRepository;
import com.lms.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService {
    private final CertificateRepository certificateRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final LearningRepository learningRepository;
    private final ProgressRepository progressRepository;
    private final LessonCompletionRepository lessonCompletionRepository;
    private final LessonRepository lessonRepository;

    @Transactional
    public CertificateView issue(UUID userId, UUID courseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (learningRepository.findByUserAndCourse(user, course) == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enroll in the course to receive its certificate");
        }
        Progress progress = progressRepository.findByUserAndCourse(user, course);
        long totalLessons = lessonRepository.countByModule_Course_Course_id(courseId);
        boolean completed = totalLessons > 0
                ? lessonCompletionRepository.countCompletedByUserAndCourse(userId, courseId) >= totalLessons
                : progress != null && progress.getDuration() > 0
                        && progress.getPlayedTime() >= progress.getDuration();
        if (!completed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Complete the course before issuing a certificate");
        }
        Certificate certificate = certificateRepository.findByUserAndCourse(user, course).orElseGet(() -> {
            Certificate created = new Certificate();
            created.setUser(user);
            created.setCourse(course);
            created.setVerificationCode("LS-" + UUID.randomUUID().toString().toUpperCase());
            return certificateRepository.save(created);
        });
        return CertificateView.from(certificate);
    }

    public CertificateView verify(String code) {
        return certificateRepository.findByVerificationCode(code)
                .map(CertificateView::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));
    }
}

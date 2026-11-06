package com.lms.dev.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.lms.dev.dto.FeedbackRequest;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.Feedback;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.FeedbackRepository;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;


    private final CourseRepository courseRepository;

    public List<Feedback> getFeedbacksForCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        return feedbackRepository.findByCourse(course);
    }

    public String submitFeedback(FeedbackRequest fr) {
        if (fr == null || fr.getComment() == null || fr.getComment().isBlank()
                || fr.getComment().length() > 2000
                || fr.getRating() != null && (fr.getRating() < 1 || fr.getRating() > 5)) {
            throw new IllegalArgumentException("Feedback must include a comment and an optional rating from 1 to 5");
        }
        Course course = courseRepository.findById(fr.getCourse_id()).orElse(null);
        Feedback feedback = new Feedback();

        if (course != null) {
            feedback.setCourse(course);
            feedback.setComment(fr.getComment());
            feedback.setRating(fr.getRating());
            feedbackRepository.save(feedback);
            return "feedback submitted successfully";
        }
        return "feedback submition failed";
    }
}

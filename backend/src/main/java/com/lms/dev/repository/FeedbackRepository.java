package com.lms.dev.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.entity.Feedback;
import com.lms.dev.entity.Course;

import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
    List<Feedback> findByCourse(Course course);

    @Query("SELECT f.course.course_id AS courseId, AVG(f.rating) AS averageRating "
            + "FROM Feedback f WHERE f.rating IS NOT NULL GROUP BY f.course.course_id")
    List<CourseRatingProjection> findCourseRatings();
}

package com.lms.dev.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.entity.Course;
import com.lms.dev.entity.Learning;
import com.lms.dev.entity.User;
import com.lms.dev.dto.CourseEnrollmentSummary;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

import java.util.UUID;

public interface LearningRepository extends JpaRepository<Learning, UUID> {

	Learning findByUserAndCourse(User user, Course course);

	@Query("SELECT l FROM Learning l JOIN FETCH l.user WHERE l.course = :course")
	java.util.List<Learning> findAllByCourse(@Param("course") Course course);
	java.util.List<Learning> findAllByUser(User user);

	@Query("SELECT new com.lms.dev.dto.CourseEnrollmentSummary(c.course_id, c.course_name, COUNT(l.id)) "
			+ "FROM Learning l JOIN l.course c GROUP BY c.course_id, c.course_name "
			+ "ORDER BY COUNT(l.id) DESC")
	java.util.List<CourseEnrollmentSummary> findCourseEnrollmentSummary();

	@Modifying
	@Transactional
	@Query("UPDATE Learning l SET l.createdAt = :createdAt WHERE l.createdAt IS NULL")
	int backfillCreatedAtForExistingEnrollments(@Param("createdAt") LocalDateTime createdAt);
}
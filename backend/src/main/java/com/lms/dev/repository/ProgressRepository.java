package com.lms.dev.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.entity.Course;
import com.lms.dev.entity.Progress;
import com.lms.dev.entity.User;

import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.lms.dev.dto.ProgressMetrics;
import com.lms.dev.dto.CourseProgressSummary;
import java.util.List;

public interface ProgressRepository extends JpaRepository<Progress, UUID> {

	Progress findByUserAndCourse(User user, Course course);

	@Query("SELECT p FROM Progress p JOIN FETCH p.course WHERE p.user = :user")
	List<Progress> findAllByUserWithCourse(@Param("user") User user);

	@Query("SELECT p FROM Progress p JOIN FETCH p.course JOIN FETCH p.user")
	List<Progress> findAllWithUserAndCourse();

	@Query("SELECT DISTINCT p.user.id FROM Progress p WHERE p.playedTime > 0")
	List<UUID> findActiveLearnerIds();

	@Query("SELECT COUNT(p) FROM Progress p WHERE p.duration > 0 AND p.playedTime >= p.duration")
	long countCompletedCourses();

	@Query("SELECT COUNT(DISTINCT p.user.id) FROM Progress p WHERE p.playedTime > 0")
	long countActiveLearners();

	@Query("SELECT new com.lms.dev.dto.ProgressMetrics("
			+ "COUNT(p.id), "
			+ "COALESCE(SUM(CASE WHEN p.duration > 0 AND p.playedTime >= p.duration THEN 1L ELSE 0L END), 0L), "
			+ "COALESCE(AVG(CASE WHEN p.duration > 0 AND p.playedTime >= p.duration THEN 100.0 "
			+ "WHEN p.duration > 0 THEN p.playedTime * 100.0 / p.duration ELSE 0.0 END), 0.0)) "
			+ "FROM Progress p")
	ProgressMetrics getProgressMetrics();

	@Query("SELECT new com.lms.dev.dto.CourseProgressSummary("
			+ "c.course_id, c.course_name, COUNT(p.id), "
			+ "COALESCE(SUM(CASE WHEN p.duration > 0 AND p.playedTime >= p.duration THEN 1L ELSE 0L END), 0L), "
			+ "COALESCE(AVG(CASE WHEN p.duration > 0 AND p.playedTime >= p.duration THEN 100.0 "
			+ "WHEN p.duration > 0 THEN p.playedTime * 100.0 / p.duration ELSE 0.0 END), 0.0)) "
			+ "FROM Progress p JOIN p.course c GROUP BY c.course_id, c.course_name "
			+ "ORDER BY COUNT(p.id) DESC")
	List<CourseProgressSummary> getCourseProgressSummaries();
}

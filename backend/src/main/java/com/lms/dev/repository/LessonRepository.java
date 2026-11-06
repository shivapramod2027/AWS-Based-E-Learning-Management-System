package com.lms.dev.repository;

import com.lms.dev.dto.CourseLessonCount;
import com.lms.dev.entity.Lesson;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findByModule_IdOrderByLessonOrderAsc(UUID moduleId);

    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.module.course.course_id = :courseId")
    long countByModule_Course_Course_id(@Param("courseId") UUID courseId);

    @Query("SELECT new com.lms.dev.dto.CourseLessonCount(l.module.course.course_id, COUNT(l)) "
            + "FROM Lesson l GROUP BY l.module.course.course_id")
    List<CourseLessonCount> findLessonCountsByCourse();
}
package com.lms.dev.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.entity.Course;

import java.util.UUID;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;


public interface CourseRepository extends JpaRepository<Course, UUID> {
    java.util.Optional<Course> findByExternalSourceAndExternalId(String externalSource, String externalId);
    @Modifying
    @Transactional
    @Query("UPDATE Course c SET c.createdAt = :createdAt WHERE c.createdAt IS NULL")
    int backfillCreatedAtForExistingCourses(@Param("createdAt") LocalDateTime createdAt);

    @Modifying
    @Transactional
    @Query("UPDATE Course c SET c.topic = 'General' WHERE c.topic IS NULL OR c.topic = ''")
    int backfillTopicForExistingCourses();

    @Modifying
    @Transactional
    @Query("UPDATE Course c SET c.difficulty = 'Unspecified' WHERE c.difficulty IS NULL OR c.difficulty = ''")
    int backfillDifficultyForExistingCourses();
}
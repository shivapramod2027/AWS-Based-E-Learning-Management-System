package com.lms.dev.repository;

import com.lms.dev.entity.Lesson;
import com.lms.dev.entity.LessonCompletion;
import com.lms.dev.entity.User;
import com.lms.dev.dto.UserCourseLessonCompletionCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LessonCompletionRepository extends JpaRepository<LessonCompletion, UUID> {
    boolean existsByLessonAndUser(Lesson lesson, User user);
    void deleteByLesson(Lesson lesson);

    @Query("SELECT lc.lesson.id FROM LessonCompletion lc WHERE lc.user.id = :userId AND lc.lesson.module.course.course_id = :courseId")
    List<UUID> findCompletedLessonIds(@Param("userId") UUID userId, @Param("courseId") UUID courseId);

    @Query("SELECT COUNT(lc.id) FROM LessonCompletion lc WHERE lc.user.id = :userId AND lc.lesson.module.course.course_id = :courseId")
    long countCompletedByUserAndCourse(@Param("userId") UUID userId, @Param("courseId") UUID courseId);

    @Query("SELECT DISTINCT lc.user.id FROM LessonCompletion lc")
    List<UUID> findDistinctUserIds();

    @Query("SELECT new com.lms.dev.dto.UserCourseLessonCompletionCount("
            + "lc.user.id, lc.lesson.module.course.course_id, COUNT(lc.id)) "
            + "FROM LessonCompletion lc GROUP BY lc.user.id, lc.lesson.module.course.course_id")
    List<UserCourseLessonCompletionCount> findCompletionCountsByUserAndCourse();
}

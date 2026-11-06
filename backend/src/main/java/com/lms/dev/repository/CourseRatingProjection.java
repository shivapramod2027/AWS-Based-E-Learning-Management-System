package com.lms.dev.repository;

import java.util.UUID;

public interface CourseRatingProjection {
    UUID getCourseId();
    Double getAverageRating();
}

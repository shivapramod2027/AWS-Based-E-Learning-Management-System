package com.lms.dev.repository;

import com.lms.dev.entity.Course;
import com.lms.dev.entity.CoursePayment;
import com.lms.dev.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CoursePaymentRepository extends JpaRepository<CoursePayment, UUID> {
    boolean existsByUserAndCourseAndStatus(User user, Course course, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM CoursePayment p WHERE p.paymentOrderId = :orderId")
    Optional<CoursePayment> findByPaymentOrderIdForUpdate(@Param("orderId") String orderId);
}

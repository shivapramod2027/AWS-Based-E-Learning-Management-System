package com.lms.dev.repository;

import com.lms.dev.entity.Certificate;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    Optional<Certificate> findByUserAndCourse(User user, Course course);
    Optional<Certificate> findByVerificationCode(String verificationCode);
}

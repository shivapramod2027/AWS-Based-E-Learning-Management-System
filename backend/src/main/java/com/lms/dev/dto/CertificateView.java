package com.lms.dev.dto;

import com.lms.dev.entity.Certificate;

import java.time.LocalDateTime;

public record CertificateView(boolean valid, String verificationCode, String learnerName,
        String courseName, LocalDateTime issuedAt) {
    public static CertificateView from(Certificate certificate) {
        return new CertificateView(true, certificate.getVerificationCode(),
                certificate.getUser().getUsername(), certificate.getCourse().getCourse_name(),
                certificate.getIssuedAt());
    }
}

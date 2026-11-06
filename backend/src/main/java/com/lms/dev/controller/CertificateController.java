package com.lms.dev.controller;

import com.lms.dev.dto.CertificateView;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {
    private final CertificateService certificateService;

    @PostMapping("/issue/{courseId}")
    @PreAuthorize("hasRole('USER')")
    public CertificateView issue(@PathVariable UUID courseId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return certificateService.issue(principal.getId(), courseId);
    }

    @GetMapping("/verify/{code}")
    public ResponseEntity<CertificateView> verify(@PathVariable String code) {
        return ResponseEntity.status(HttpStatus.OK).body(certificateService.verify(code));
    }
}

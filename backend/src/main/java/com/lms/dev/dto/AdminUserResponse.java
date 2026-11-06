package com.lms.dev.dto;

import com.lms.dev.entity.User;
import com.lms.dev.enums.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String username,
        String email,
        String mobileNumber,
        UserRole role,
        Boolean isActive,
        LocalDateTime createdAt,
        String dob,
        String gender,
        String location,
        String profession,
        String linkedin_url,
        String github_url
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt(),
                user.getDob(),
                user.getGender(),
                user.getLocation(),
                user.getProfession(),
                user.getLinkedin_url(),
                user.getGithub_url()
        );
    }
}

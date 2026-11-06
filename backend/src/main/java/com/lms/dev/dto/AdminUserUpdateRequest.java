package com.lms.dev.dto;

import com.lms.dev.enums.UserRole;
import lombok.Data;

@Data
public class AdminUserUpdateRequest {
    private String username;
    private String email;
    private String mobileNumber;
    private String dob;
    private String gender;
    private String location;
    private String profession;
    private String linkedin_url;
    private String github_url;
    private UserRole role;
    private Boolean isActive;
}

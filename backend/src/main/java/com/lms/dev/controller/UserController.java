package com.lms.dev.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.lms.dev.entity.User;
import com.lms.dev.dto.AdminUserResponse;
import com.lms.dev.dto.AdminUserUpdateRequest;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.service.UserService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<AdminUserResponse> getAllUsers() {
        return userService.getAllUsers().stream().map(AdminUserResponse::from).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{id}")
    public ResponseEntity<AdminUserResponse> updateUserAsAdmin(
            @PathVariable UUID id,
            @RequestBody AdminUserUpdateRequest request) {
        User user = userService.updateUserAsAdmin(id, request);
        return user == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(AdminUserResponse.from(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isAdmin(principal) && !principal.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        User user = userService.getUserById(id);
        return user == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(user);
    }

    @GetMapping("/{id}/profile-image")
    public ResponseEntity<byte[]> getProfileImage(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isAdmin(principal) && !principal.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        User user = userService.getUserById(id);
        if (user == null || user.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(user.getProfileImage());
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<String> uploadProfileImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isAdmin(principal) && !principal.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You cannot update another user's profile image");
        }
        try {
            userService.updateUserProfile(file, id);
            return ResponseEntity.ok("Image uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error uploading image");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable UUID id,
            @RequestBody User updatedUser,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isAdmin(principal) && !principal.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        User user = userService.updateUser(id, updatedUser);
        return user == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
    }

    @GetMapping("/details")
    public ResponseEntity<User> getUserByEmail(
            @RequestParam String email,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!isAdmin(principal) && !principal.getEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        User user = userService.getUserByEmail(email);
        return user == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(user);
    }

    private boolean isAdmin(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
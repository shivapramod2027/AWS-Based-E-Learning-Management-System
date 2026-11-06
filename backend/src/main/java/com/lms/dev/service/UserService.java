package com.lms.dev.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dev.entity.User;
import com.lms.dev.repository.UserRepository;
import com.lms.dev.enums.UserRole;
import com.lms.dev.dto.AdminUserUpdateRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id).orElse(null);
    }

    public User createUser(User user) {
        if (user == null || user.getUsername() == null || user.getUsername().isBlank()
                || user.getEmail() == null || user.getEmail().isBlank()
                || user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Username, email, and password are required");
        }
        user.setId(null);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(UserRole.USER);
        user.setIsActive(true);
        user.setDailyRemindersEnabled(true);
        user.setPreferredReminderTime(java.time.LocalTime.of(9, 0));
        user.setProfileImage(null);
        user.setLearningCourses(null);
        User savedUser = userRepository.save(user);
        notificationService.notifyWelcome(savedUser);
        return savedUser;
    }

    public void updateUserProfile(MultipartFile file, UUID id) throws IOException {
        User user = getUserById(id);
        if (user == null) return;
        user.setProfileImage(file.getBytes());
        userRepository.save(user);
    }

    public User updateUser(UUID id, User updatedUser) {
        User existingUser = userRepository.findById(id).orElse(null);
        if (existingUser != null) {
            existingUser.setUsername(updatedUser.getUsername());
            existingUser.setEmail(updatedUser.getEmail());
            existingUser.setDob(updatedUser.getDob());
            existingUser.setMobileNumber(updatedUser.getMobileNumber());
            existingUser.setGender(updatedUser.getGender());
            existingUser.setLocation(updatedUser.getLocation());
            existingUser.setProfession(updatedUser.getProfession());
            existingUser.setLinkedin_url(updatedUser.getLinkedin_url());
            existingUser.setGithub_url(updatedUser.getGithub_url());
            return userRepository.save(existingUser);
        }
        return null;
    }

    @Transactional
    public User updateUserAsAdmin(UUID id, AdminUserUpdateRequest request) {
        User existingUser = userRepository.findById(id).orElse(null);
        if (existingUser == null) {
            return null;
        }
        if (request.getUsername() == null || request.getUsername().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()
                || request.getRole() == null || request.getIsActive() == null) {
            throw new IllegalArgumentException("Name, email, role, and account status are required");
        }
        if (!existingUser.getEmail().equalsIgnoreCase(request.getEmail().trim())) {
            User emailOwner = userRepository.findByEmail(request.getEmail().trim());
            if (emailOwner != null && !emailOwner.getId().equals(existingUser.getId())) {
                throw new IllegalArgumentException("That email address is already in use");
            }
        }
        long activeAdminCount = userRepository.findActiveUsersByRoleForUpdate(UserRole.ADMIN).size();
        if (existingUser.getRole() == UserRole.ADMIN && Boolean.TRUE.equals(existingUser.getIsActive())
                && (request.getRole() != UserRole.ADMIN || !request.getIsActive())
                && activeAdminCount <= 1) {
            throw new IllegalArgumentException("The last active administrator cannot be demoted or deactivated");
        }

        existingUser.setUsername(request.getUsername().trim());
        existingUser.setEmail(request.getEmail().trim());
        existingUser.setMobileNumber(request.getMobileNumber());
        existingUser.setDob(request.getDob());
        existingUser.setGender(request.getGender());
        existingUser.setLocation(request.getLocation());
        existingUser.setProfession(request.getProfession());
        existingUser.setLinkedin_url(request.getLinkedin_url());
        existingUser.setGithub_url(request.getGithub_url());
        existingUser.setRole(request.getRole());
        existingUser.setIsActive(request.getIsActive());
        return userRepository.save(existingUser);
    }
    
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public User authenticateUser(String email, String password) {
        return userRepository.findByEmailAndPassword(email, password);
    }

    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }
}

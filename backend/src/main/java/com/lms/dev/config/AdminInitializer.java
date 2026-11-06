package com.lms.dev.config;

import com.lms.dev.entity.User;
import com.lms.dev.enums.UserRole;
import com.lms.dev.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Slf4j
public class AdminInitializer {

    @Value("${app.default-admin.username:}")
    private String defaultUsername;

    @Value("${app.default-admin.password:}")
    private String defaultPassword;

    @Value("${app.default-admin.email:}")
    private String defaultEmail;

    @Bean
    public CommandLineRunner createDefaultAdmin(UserRepository userRepository,
                                                PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.existsByRole(UserRole.ADMIN)) {
                log.info("Admin user already exists, skipping creation.");
                return;
            }

            if (defaultUsername.isBlank() || defaultPassword.isBlank() || defaultEmail.isBlank()) {
                log.warn("Admin account creation skipped; configure ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD.");
                return;
            }

            User admin = new User();
            admin.setUsername(defaultUsername);
            admin.setPassword(passwordEncoder.encode(defaultPassword));
            admin.setEmail(defaultEmail);
            admin.setRole(UserRole.ADMIN);
            userRepository.save(admin);
            log.info("Configured admin user created.");
        };
    }
}
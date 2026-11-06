package com.lms.dev.repository;

import com.lms.dev.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.entity.User;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.LockModeType;

public interface UserRepository extends JpaRepository<User, UUID> {

	User findByEmail(String email);

    boolean existsByRole(UserRole role);
    List<User> findByDailyRemindersEnabledTrueAndIsActiveTrue();

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.dailyRemindersEnabled = true WHERE u.dailyRemindersEnabled IS NULL")
    int backfillDailyReminderPreferences();

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.preferredReminderTime = :reminderTime WHERE u.preferredReminderTime IS NULL")
    int backfillPreferredReminderTime(@Param("reminderTime") java.time.LocalTime reminderTime);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.isActive = true")
    List<User> findActiveUsersByRoleForUpdate(@Param("role") UserRole role);

	User findByEmailAndPassword(String email, String password);
}

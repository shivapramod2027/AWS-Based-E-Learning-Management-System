package com.lms.dev.dto;

import java.time.LocalTime;

public record NotificationPreferences(boolean dailyRemindersEnabled, LocalTime preferredReminderTime) {
}

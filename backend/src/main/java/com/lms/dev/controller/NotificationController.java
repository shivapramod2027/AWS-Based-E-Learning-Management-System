package com.lms.dev.controller;

import com.lms.dev.dto.NotificationView;
import com.lms.dev.dto.NotificationPreferences;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationView> getNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.getNotifications(principal.getId()).stream()
                .map(NotificationView::from).toList();
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.getUnreadCount(principal.getId());
    }

    @GetMapping("/preferences")
    public NotificationPreferences getPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.getPreferences(principal.getId());
    }

    @PutMapping("/preferences")
    public NotificationPreferences updatePreferences(
            @RequestBody NotificationPreferences preferences,
            @AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.updatePreferences(principal.getId(), preferences);
    }

    @PutMapping("/{notificationId}/read")
    public void markRead(@PathVariable UUID notificationId,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markRead(notificationId, principal.getId());
    }
}

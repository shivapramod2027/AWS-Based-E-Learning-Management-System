package com.lms.dev.service;

import com.lms.dev.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailNotificationService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String fromAddress;

    public EmailNotificationService(ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.from:}") String fromAddress) {
        this.mailSenderProvider = mailSenderProvider;
        this.fromAddress = fromAddress;
    }

    public boolean send(User user, String subject, String text) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            log.warn("Email not sent for user {}: no email address is registered.", user.getId());
            return false;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || fromAddress.isBlank()) {
            log.warn("Email not sent to {}: configure MAIL_HOST and MAIL_FROM to enable email delivery.",
                    user.getEmail());
            return false;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject(subject);
        message.setText(text);
        try {
            mailSender.send(message);
            return true;
        } catch (MailException exception) {
            log.error("Email delivery failed for user {} with subject '{}'.", user.getId(), subject, exception);
            return false;
        }
    }
}

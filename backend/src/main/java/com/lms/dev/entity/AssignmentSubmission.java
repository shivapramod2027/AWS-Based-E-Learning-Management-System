package com.lms.dev.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"assignment_id", "user_id"}))
@Data
@NoArgsConstructor
public class AssignmentSubmission {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 8000)
    private String content;

    private String submissionUrl;

    private Double grade;

    @Column(length = 4000)
    private String feedback;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    protected void onSave() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}

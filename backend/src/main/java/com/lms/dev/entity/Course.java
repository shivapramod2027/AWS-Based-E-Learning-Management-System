package com.lms.dev.entity;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"external_source", "external_id"}))
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Course {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "course_id", updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID course_id;

    @JsonProperty("course_name")
    private String course_name;

    private int price;

    private String instructor;

    private String description;

    private String topic;

    private String difficulty;

    private Double rating;

    private String duration;

    @Column(length = 2000)
    private String learningObjectives;

    @Column(name = "external_source")
    private String externalSource;

    @Column(name = "external_id")
    private String externalId;

    @Column(length = 1000)
    private String externalUrl;

    private String p_link;

    private String y_link;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Feedback> feedbacks;
    
    @OneToMany(mappedBy = "course")
    @JsonIgnore
    private List<Questions> questions;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<CourseModule> modules;
}

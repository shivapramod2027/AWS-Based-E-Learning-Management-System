package com.lms.dev.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(indexes = @Index(columnList = "module_id, lesson_order"))
@Data
@NoArgsConstructor
public class Lesson {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(optional = false)
    @JsonIgnore
    @JoinColumn(name = "module_id", nullable = false)
    private CourseModule module;

    @Column(nullable = false)
    private String title;

    @Column(length = 8000)
    private String content;

    @Column(length = 1000)
    private String videoUrl;

    @Column(name = "lesson_order", nullable = false)
    private int lessonOrder;

    private Integer durationMinutes;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonResource> resources = new ArrayList<>();
}

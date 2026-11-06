package com.lms.dev.config;

import com.lms.dev.entity.Course;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LearningRepository;
import com.lms.dev.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.time.LocalDateTime;

@Configuration
@Slf4j
public class DemoCourseInitializer {

    private static final List<String> TOPICS = List.of(
            "Python Programming", "Java Programming", "JavaScript Development",
            "Web Development", "React Development", "Node.js Development",
            "Spring Boot", "SQL and Database Design", "Data Analytics",
            "Machine Learning", "Artificial Intelligence", "Cloud Computing",
            "AWS Cloud", "Azure Cloud", "Cybersecurity", "Network Administration",
            "DevOps Engineering", "Docker and Containers", "Kubernetes",
            "Git and Version Control", "Mobile App Development", "UI and UX Design",
            "Product Management", "Project Management", "Business Analysis",
            "Digital Marketing", "Search Engine Optimization", "Content Writing",
            "Graphic Design", "Excel for Business", "Financial Planning",
            "Entrepreneurship", "Public Speaking", "Technical Writing",
            "Statistics", "Data Visualization", "Computer Science Fundamentals",
            "Algorithms and Data Structures", "API Development", "Software Testing"
    );

    private static final List<String> COURSE_FORMATS = List.of(
            "Foundations of %s",
            "Practical %s for Beginners",
            "%s: From Basics to Projects",
            "Advanced %s",
            "%s for Professionals",
            "Building Real-World Projects with %s",
            "%s Masterclass",
            "Career Track: %s",
            "Applied %s",
            "Modern %s Workflows",
            "%s in Practice",
            "The Complete Guide to %s",
            "Hands-On %s",
            "%s Bootcamp",
            "Real-World %s"
    );

    private static final List<String> INSTRUCTORS = List.of(
            "Alex Morgan", "Jordan Lee", "Taylor Kim", "Casey Patel", "Riley Chen",
            "Sam Rivera", "Avery Brooks", "Jamie Taylor", "Morgan Ellis", "Cameron Reed"
    );

    private static final List<String> THUMBNAILS = List.of(
            "photo-1516321318423-f06f85e504b3",
            "photo-1498050108023-c5249f4df085",
            "photo-1519389950473-47ba0277781c",
            "photo-1451187580459-43490279c0fa",
            "photo-1516321497487-e288fb19713f",
            "photo-1509062522246-3755977927d7",
            "photo-1522071820081-009f0129c71c",
            "photo-1531482615713-2afd69097998"
    );

    @Value("${app.demo-courses.enabled:false}")
    private boolean enabled;

    @Value("${app.demo-courses.target-count:300}")
    private int targetCount;

    @Bean
    public CommandLineRunner seedDemoCourses(CourseRepository courseRepository, LearningRepository learningRepository,
            UserRepository userRepository) {
        return args -> {
            LocalDateTime migrationTimestamp = LocalDateTime.now();
            int migratedCourses = courseRepository.backfillCreatedAtForExistingCourses(migrationTimestamp);
            int migratedEnrollments = learningRepository.backfillCreatedAtForExistingEnrollments(migrationTimestamp);
            int migratedTopics = courseRepository.backfillTopicForExistingCourses();
            int migratedDifficulties = courseRepository.backfillDifficultyForExistingCourses();
            int migratedReminderPreferences = userRepository.backfillDailyReminderPreferences();
            int migratedReminderTimes = userRepository.backfillPreferredReminderTime(java.time.LocalTime.of(9, 0));
            if (migratedCourses > 0 || migratedEnrollments > 0 || migratedTopics > 0 || migratedDifficulties > 0
                    || migratedReminderPreferences > 0 || migratedReminderTimes > 0) {
                log.info("Backfilled {} course timestamps, {} enrollment timestamps, {} course topics, {} course difficulty levels, {} reminder preferences, and {} reminder times.",
                        migratedCourses, migratedEnrollments, migratedTopics, migratedDifficulties,
                        migratedReminderPreferences, migratedReminderTimes);
            }

            if (!enabled) {
                log.info("Demo course seeding is disabled.");
                return;
            }

            if (targetCount < 0) {
                throw new IllegalArgumentException("Demo course target count cannot be negative");
            }

            seedCourses(courseRepository);
        };
    }

    @Transactional
    public void seedCourses(CourseRepository courseRepository) {
        List<Course> existingCourses = courseRepository.findAll();
        if (existingCourses.size() >= targetCount) {
            log.info("Course count is already {}; demo course seeding skipped.", existingCourses.size());
            return;
        }

        Set<String> existingNames = new HashSet<>();
        existingCourses.stream()
                .map(Course::getCourse_name)
                .filter(name -> name != null)
                .map(name -> name.toLowerCase(Locale.ROOT))
                .forEach(existingNames::add);

        List<Course> coursesToSave = new ArrayList<>();
        for (int topicIndex = 0; topicIndex < TOPICS.size()
                && existingCourses.size() + coursesToSave.size() < targetCount; topicIndex++) {
            for (int formatIndex = 0; formatIndex < COURSE_FORMATS.size()
                    && existingCourses.size() + coursesToSave.size() < targetCount; formatIndex++) {
                String topic = TOPICS.get(topicIndex);
                String courseName = COURSE_FORMATS.get(formatIndex).formatted(topic);
                if (!existingNames.add(courseName.toLowerCase(Locale.ROOT))) {
                    continue;
                }

                Course course = new Course();
                course.setCourse_name(courseName);
                course.setTopic(topic);
                course.setDifficulty(switch (formatIndex % 3) {
                    case 0 -> "Beginner";
                    case 1 -> "Intermediate";
                    default -> "Advanced";
                });
                course.setInstructor(INSTRUCTORS.get((topicIndex + formatIndex) % INSTRUCTORS.size()));
                course.setDescription(String.format(
                        "Build practical skills in %s with clear lessons, guided exercises, and hands-on projects. "
                                + "Explore essential concepts, practice useful workflows, and apply what you learn "
                                + "in a portfolio-ready capstone.",
                        topic
                ));
                course.setPrice((topicIndex * 7 + formatIndex * 3) % 5 == 0
                        ? 0
                        : 19 + ((topicIndex * 11 + formatIndex * 7) % 81));
                course.setP_link("https://images.unsplash.com/" + THUMBNAILS.get(
                        (topicIndex + formatIndex) % THUMBNAILS.size())
                        + "?auto=format&fit=crop&w=960&q=80");
                coursesToSave.add(course);
            }
        }

        if (existingCourses.size() + coursesToSave.size() < targetCount) {
            throw new IllegalStateException("Not enough unique demo course titles to reach the configured target");
        }

        courseRepository.saveAll(coursesToSave);
        log.info("Added {} demo courses; total course count is {}.",
                coursesToSave.size(), existingCourses.size() + coursesToSave.size());
    }
}

package com.lms.dev.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.lms.dev.entity.Course;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.FeedbackRepository;
import com.lms.dev.repository.LearningRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Locale;

@RequiredArgsConstructor
@Service
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;
    private final FeedbackRepository feedbackRepository;
    private final LearningRepository learningRepository;
    private final NotificationService notificationService;

    @Value("${app.course-catalog.url:}")
    private String catalogUrl;

    @Value("${app.course-catalog.api-key:}")
    private String catalogApiKey;

    private final Object catalogSyncLock = new Object();
    private volatile long nextCatalogSyncMillis;

    public List<Course> getAllCourses() {
        syncExternalCatalog();
        List<Course> courses = courseRepository.findAll();
        var ratings = feedbackRepository.findCourseRatings().stream()
                .collect(java.util.stream.Collectors.toMap(
                        com.lms.dev.repository.CourseRatingProjection::getCourseId,
                        com.lms.dev.repository.CourseRatingProjection::getAverageRating));
        courses.forEach(course -> {
            Double averageRating = ratings.get(course.getCourse_id());
            if (averageRating != null) course.setRating(averageRating);
        });
        return courses;
    }

    private void syncExternalCatalog() {
        if (catalogUrl == null || catalogUrl.isBlank()) return;
        if (System.currentTimeMillis() < nextCatalogSyncMillis) return;
        synchronized (catalogSyncLock) {
            long now = System.currentTimeMillis();
            if (now < nextCatalogSyncMillis) return;
            nextCatalogSyncMillis = now + Duration.ofMinutes(5).toMillis();
            try {
                SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
                requestFactory.setConnectTimeout(Duration.ofSeconds(3));
                requestFactory.setReadTimeout(Duration.ofSeconds(5));
                JsonNode root = RestClient.builder().requestFactory(requestFactory).build()
                        .get().uri(catalogUrl)
                        .headers(headers -> {
                            if (catalogApiKey != null && !catalogApiKey.isBlank()) {
                                headers.setBearerAuth(catalogApiKey);
                            }
                        })
                        .retrieve().body(JsonNode.class);
                JsonNode items = findCourseItems(root);
                if (items == null || !items.isArray()) {
                    log.warn("Configured course catalog returned an unsupported response; using saved courses.");
                    return;
                }
                List<Course> imported = new ArrayList<>();
                Iterator<JsonNode> iterator = items.elements();
                while (iterator.hasNext()) {
                    JsonNode item = iterator.next();
                    String title = firstText(item, "title", "name", "course_name");
                    String externalId = firstText(item, "key", "id", "course_id", "course");
                    if (title == null || title.isBlank() || externalId == null || externalId.isBlank()) {
                        log.warn("Skipping external catalog item without a title or stable ID.");
                        continue;
                    }
                    Course course = courseRepository
                            .findByExternalSourceAndExternalId("external", externalId)
                            .orElseGet(Course::new);
                    course.setExternalSource("external");
                    course.setExternalId(externalId);
                    course.setCourse_name(title);
                    course.setDescription(firstText(item, "short_description", "description", "summary"));
                    course.setLearningObjectives(firstText(item, "learning_objectives", "objectives"));
                    course.setInstructor(firstOwner(item));
                    course.setP_link(firstText(item, "course_image", "image_url", "image"));
                    course.setExternalUrl(firstText(item, "marketing_url", "course_url", "url"));
                    course.setTopic(firstText(item, "subject", "topic", "category"));
                    course.setDifficulty(normalizeDifficulty(firstText(item, "level", "difficulty")));
                    course.setDuration(firstText(item, "effort", "duration"));
                    course.setRating(numberValue(item, "rating", "average_rating"));
                    if (course.getPrice() < 0) course.setPrice(0);
                    imported.add(course);
                }
                if (!imported.isEmpty()) {
                    courseRepository.saveAll(imported);
                    log.info("Synchronized {} courses from the configured external catalog.", imported.size());
                }
            } catch (RestClientException exception) {
                log.error("External course catalog request failed; returning courses saved in MySQL.", exception);
            }
        }
    }

    private JsonNode findCourseItems(JsonNode root) {
        if (root == null) return null;
        if (root.isArray()) return root;
        for (String property : List.of("results", "courses", "items", "data")) {
            JsonNode candidate = root.get(property);
            if (candidate != null && candidate.isArray()) return candidate;
        }
        return null;
    }

    private String firstText(JsonNode item, String... names) {
        for (String name : names) {
            JsonNode value = item.get(name);
            if (value != null && !value.isNull() && value.isValueNode()) {
                String text = value.asText().trim();
                if (!text.isEmpty()) return text;
            }
        }
        return null;
    }

    private String firstOwner(JsonNode item) {
        JsonNode owners = item.path("owners");
        if (owners.isArray() && !owners.isEmpty()) {
            JsonNode owner = owners.get(0);
            String name = firstText(owner, "name", "title");
            if (name != null) return name;
        }
        return firstText(item, "instructor", "provider", "organization");
    }

    private Double numberValue(JsonNode item, String... names) {
        for (String name : names) {
            JsonNode value = item.get(name);
            if (value != null && value.isNumber()) return value.asDouble();
        }
        return null;
    }

    private String normalizeDifficulty(String value) {
        if (value == null) return "Unspecified";
        String normalized = value.toLowerCase(Locale.ROOT);
        if (normalized.contains("beginner") || normalized.contains("intro")) return "Beginner";
        if (normalized.contains("intermediate")) return "Intermediate";
        if (normalized.contains("advanced")) return "Advanced";
        return value;
    }

    public Course getCourseById(UUID id) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course != null) {
            feedbackRepository.findCourseRatings().stream()
                    .filter(rating -> rating.getCourseId().equals(course.getCourse_id()))
                    .findFirst().ifPresent(rating -> course.setRating(rating.getAverageRating()));
        }
        return course;
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(UUID id, Course updatedCourse) {
        Course existingCourse = courseRepository.findById(id).orElse(null);
        if (existingCourse != null) {
            existingCourse.setCourse_name(updatedCourse.getCourse_name());
            existingCourse.setDescription(updatedCourse.getDescription());
            existingCourse.setTopic(updatedCourse.getTopic());
            existingCourse.setDifficulty(updatedCourse.getDifficulty());
            existingCourse.setRating(updatedCourse.getRating());
            existingCourse.setDuration(updatedCourse.getDuration());
            existingCourse.setLearningObjectives(updatedCourse.getLearningObjectives());
            existingCourse.setP_link(updatedCourse.getP_link());
            existingCourse.setPrice(updatedCourse.getPrice());
            existingCourse.setInstructor(updatedCourse.getInstructor());
            existingCourse.setY_link(updatedCourse.getY_link());
            Course savedCourse = courseRepository.save(existingCourse);
            learningRepository.findAllByCourse(savedCourse).forEach(enrollment ->
                    notificationService.notifyCourseUpdated(enrollment.getUser(), savedCourse));
            return savedCourse;
        }
        return null;
    }

    public void deleteCourse(UUID id) {
        courseRepository.deleteById(id);
    }
}

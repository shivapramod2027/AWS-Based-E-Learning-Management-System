package com.lms.dev.config;

import com.lms.dev.entity.Course;
import com.lms.dev.entity.CourseModule;
import com.lms.dev.entity.Lesson;
import com.lms.dev.repository.CourseModuleRepository;
import com.lms.dev.repository.CourseRepository;
import com.lms.dev.repository.LessonRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Locale;
import java.util.ArrayList;

@Configuration
@Slf4j
public class DemoCourseContentInitializer {

    @Value("${app.demo-content.enabled:true}")
    private boolean enabled;

    @Bean
    @Order(Ordered.LOWEST_PRECEDENCE)
    public CommandLineRunner seedStarterCourseContent(
            CourseRepository courseRepository,
            CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository,
            PlatformTransactionManager transactionManager) {
        return args -> {
            if (!enabled) {
                log.info("Demo course content seeding is disabled.");
                return;
            }
            Integer seededCourses = new TransactionTemplate(transactionManager).execute(status -> {
                int count = 0;
                for (Course course : courseRepository.findAll()) {
                    if (hasEmptyContent(course, moduleRepository, lessonRepository)) {
                        seedCourse(course, moduleRepository, lessonRepository);
                        count++;
                    }
                }
                return count;
            });
            if (seededCourses != null && seededCourses > 0) {
                log.info("Added interactive starter lessons to {} empty courses.", seededCourses);
            }
        };
    }

    private void seedCourse(Course course, CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository) {
        String topic = course.getTopic() == null || course.getTopic().isBlank()
                ? "this subject" : course.getTopic().trim();
        boolean artificialIntelligence = (course.getCourse_name() + " " + topic)
                .toLowerCase(Locale.ROOT).contains("artificial intelligence")
                || (course.getCourse_name() + " " + topic).toLowerCase(Locale.ROOT).matches(".*\\bai\\b.*");

        List<ModuleContent> modules = artificialIntelligence
                ? artificialIntelligenceContent()
                : generalContent(topic);
        List<CourseModule> existingModules = new ArrayList<>(
                moduleRepository.findByCourse_Course_idOrderByModuleOrderAsc(course.getCourse_id()));
        if (existingModules.isEmpty()) {
            for (int moduleIndex = 0; moduleIndex < modules.size(); moduleIndex++) {
                ModuleContent content = modules.get(moduleIndex);
                CourseModule module = new CourseModule();
                module.setCourse(course);
                module.setTitle(content.title());
                module.setDescription(content.description());
                module.setModuleOrder(moduleIndex);
                existingModules.add(moduleRepository.save(module));
            }
        }

        for (int moduleIndex = 0; moduleIndex < existingModules.size(); moduleIndex++) {
            CourseModule module = existingModules.get(moduleIndex);
            if (!lessonRepository.findByModule_IdOrderByLessonOrderAsc(module.getId()).isEmpty()) {
                continue;
            }
            ModuleContent content = modules.get(moduleIndex % modules.size());
            for (int lessonIndex = 0; lessonIndex < content.lessons().size(); lessonIndex++) {
                LessonContent lessonContent = content.lessons().get(lessonIndex);
                Lesson lesson = new Lesson();
                lesson.setModule(module);
                lesson.setTitle(lessonContent.title());
                lesson.setContent(lessonContent.content());
                lesson.setLessonOrder(lessonIndex);
                lesson.setDurationMinutes(lessonContent.durationMinutes());
                lessonRepository.save(lesson);
            }
        }
    }

    private boolean hasEmptyContent(Course course, CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository) {
        List<CourseModule> modules =
                moduleRepository.findByCourse_Course_idOrderByModuleOrderAsc(course.getCourse_id());
        return modules.isEmpty() || modules.stream()
                .anyMatch(module -> lessonRepository.findByModule_IdOrderByLessonOrderAsc(module.getId()).isEmpty());
    }

    private List<ModuleContent> artificialIntelligenceContent() {
        return List.of(
                new ModuleContent("AI foundations", "Understand what AI can and cannot do.",
                        List.of(
                                new LessonContent("What is artificial intelligence?",
                                        """
                                        AI describes computer systems that perform tasks involving prediction, language, perception, or decision support. Machine learning is one approach: a model learns patterns from examples rather than following only hand-written rules.

                                        Key idea: a model produces a result based on its training and input; it does not automatically know whether that result is true.

                                        Try it: write down one everyday task where AI could help. Identify the input, the output, and one way the result could be wrong.""", 10),
                                new LessonContent("Data, models, and predictions",
                                        """
                                        A machine-learning workflow uses examples (data) to fit a model, then uses that model to make predictions on new inputs. Data quality, representation, and coverage strongly affect the results.

                                        Mini activity: imagine predicting whether a plant needs water. List three useful observations and one important observation your list might miss. Explain how missing or biased examples could mislead the model.""", 12))),
                new ModuleContent("Working with generative AI", "Practice clear instructions and verify generated results.",
                        List.of(
                                new LessonContent("Write a useful prompt",
                                        """
                                        A useful prompt states the goal, gives relevant context, sets constraints, and describes the desired format. Improve the result by asking for one task at a time and checking whether the answer meets your criteria.

                                        Prompt challenge: ask an AI tool to explain a topic you know. Then revise your prompt to specify the learner's level, a short format, and one example. Compare the answers and note what improved.""", 12),
                                new LessonContent("Check AI-generated answers",
                                        """
                                        Generative AI can produce fluent but inaccurate content. Verify important claims using trusted references, check dates and calculations, and avoid submitting private or sensitive information to tools that are not approved for it.

                                        Verification exercise: take one factual claim from an AI-generated answer and check it against two reliable sources. Record the claim, sources, and whether the answer needs correction.""", 12))),
                new ModuleContent("Responsible use and mini project", "Apply the concepts in a small, human-reviewed workflow.",
                        List.of(
                                new LessonContent("Fairness, privacy, and human review",
                                        """
                                        AI systems can reflect gaps or bias in their data. Before using an AI result, consider who could be affected, what information is being shared, and how a person can review or challenge the outcome.

                                        Reflection: describe one risk in using an automated system to make an important decision. Propose a human review step that could reduce that risk.""", 10),
                                new LessonContent("Capstone: design a helpful AI workflow",
                                        """
                                        Design a small AI-assisted workflow for a real task. Write down: (1) the user's goal, (2) safe input data, (3) the instruction you would give the tool, (4) how you will verify the result, and (5) when a person must take over.

                                        Finish by testing your workflow on one example. Mark this lesson complete when you can explain both its benefit and its limitation.""", 15))));
    }

    private List<ModuleContent> generalContent(String topic) {
        return List.of(
                new ModuleContent(topic + " essentials", "Build a foundation and connect key ideas to practical examples.",
                        List.of(
                                new LessonContent("Start with the core concepts",
                                        """
                                        Begin by describing the main goal of %s in your own words. Identify three important terms, explain how they relate, and write down one question you want this course to answer.

                                        Activity: create a small concept map or bullet list. Add a real-world example for each term and explain how the concepts fit together.""".formatted(topic), 10),
                                new LessonContent("Learn by observing examples",
                                        """
                                        Study an example related to %s. Break it into steps: what information or materials are needed, what decisions are made, and what a successful result looks like.

                                        Practice: choose a different example and follow the same steps. Note one assumption that could change the result.""".formatted(topic), 12))),
                new ModuleContent("Guided practice", "Turn the concepts into a small, repeatable exercise.",
                        List.of(
                                new LessonContent("Try a hands-on exercise",
                                        """
                                        Apply one idea from the previous module to a small task involving %s. Work in short steps, check your result after each step, and keep a note of anything that did not work as expected.

                                        Checkpoint: write down your starting point, the action you took, and the evidence that your result is correct.""".formatted(topic), 15),
                                new LessonContent("Troubleshoot and improve",
                                        """
                                        When a result is not right, reproduce the issue, inspect one cause at a time, and make a small change. Compare the new result with your original goal rather than guessing that a change helped.

                                        Activity: describe one possible mistake in your exercise. Explain how you would detect it and what you would try next.""", 12))),
                new ModuleContent("Mini project", "Use the course ideas to create and review a small outcome.",
                        List.of(
                                new LessonContent("Plan your project",
                                        """
                                        Pick a small, achievable problem related to %s. Define who it helps, what the finished result should do, and how you will tell whether it works.

                                        Write a three-step plan. Keep the scope small enough to finish in one sitting.""".formatted(topic), 10),
                                new LessonContent("Build, review, and reflect",
                                        """
                                        Complete your mini project and test it with one realistic example. Check the result against your success criteria, then identify one improvement and one limitation.

                                        Reflection: explain what you learned, what you would change next, and where this skill could be useful.""", 15))));
    }

    private record ModuleContent(String title, String description, List<LessonContent> lessons) {}

    private record LessonContent(String title, String content, int durationMinutes) {}
}

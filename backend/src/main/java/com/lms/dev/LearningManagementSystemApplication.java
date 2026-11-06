package com.lms.dev;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LearningManagementSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(LearningManagementSystemApplication.class, args);
	}
}

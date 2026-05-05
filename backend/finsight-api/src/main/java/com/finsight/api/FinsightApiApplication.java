package com.finsight.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = "com.finsight")
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.finsight.api.repository")
public class FinsightApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinsightApiApplication.class, args);
    }
}

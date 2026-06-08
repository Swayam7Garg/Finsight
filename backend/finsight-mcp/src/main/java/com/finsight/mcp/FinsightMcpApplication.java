package com.finsight.mcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@ComponentScan(
    basePackages = {
        "com.finsight.common",
        "com.finsight.api.service",
        "com.finsight.api.repository",
        "com.finsight.mcp"
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = ".*(Auth|CsvImport|Dev)Service.*"
    )
)
@EnableMongoRepositories(basePackages = {
    "com.finsight.api.repository",
    "com.finsight.mcp"
})
public class FinsightMcpApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinsightMcpApplication.class, args);
    }
}

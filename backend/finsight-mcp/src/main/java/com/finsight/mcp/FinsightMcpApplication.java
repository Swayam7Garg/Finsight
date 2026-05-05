package com.finsight.mcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.finsight.common", "com.finsight.api", "com.finsight.mcp"})
public class FinsightMcpApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinsightMcpApplication.class, args);
    }
}

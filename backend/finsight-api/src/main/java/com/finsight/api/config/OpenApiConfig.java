package com.finsight.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI finsightOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("FinSight API")
                        .description("FinSight — Personal Finance Tracker REST API")
                        .version("1.0.0")
                        .contact(new Contact().name("FinSight Team")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Auth"))
                .schemaRequirement("Bearer Auth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("JWT access token — get it from /api/v1/auth/login"));
    }
}

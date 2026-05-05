package com.finsight.mcp.tool;

import com.finsight.api.service.CategoryService;
import com.finsight.common.dto.category.CreateCategoryRequest;
import com.finsight.common.dto.category.UpdateCategoryRequest;
import com.finsight.mcp.config.McpJwtAuthResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.springframework.core.NestedExceptionUtils;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class CategoryTool {

    private final CategoryService categoryService;
    private final McpJwtAuthResolver authResolver;

    public record CategoryListRequest(String token) {}
    public record SingleCategoryRequest(String token, String categoryId) {}
    public record CategoryCreateRequest(String token, CreateCategoryRequest payload) {}
    public record CategoryUpdateRequest(String token, String categoryId, UpdateCategoryRequest payload) {}

    @Bean
    @Description("List all transaction categories (income and expense)")
    public Function<CategoryListRequest, String> listCategories() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                List<Map<String, Object>> categories = categoryService.list(userId);
                return toJson(categories);
            } catch (Exception e) {
                return "Error listing categories: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Get a specific category by its ID")
    public Function<SingleCategoryRequest, String> getCategory() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                Map<String, Object> category = categoryService.getById(userId, req.categoryId());
                return toJson(category);
            } catch (Exception e) {
                return "Error getting category: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Create a new transaction category")
    public Function<CategoryCreateRequest, String> createCategory() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                Map<String, Object> category = categoryService.create(
                        userId,
                        req.payload().getName(),
                        req.payload().getIcon(),
                        req.payload().getColor(),
                        req.payload().getType()
                );
                return toJson(category);
            } catch (Exception e) {
                return "Error creating category: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Update a custom transaction category (system defaults cannot be updated)")
    public Function<CategoryUpdateRequest, String> updateCategory() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                Map<String, Object> category = categoryService.update(
                        userId,
                        req.categoryId(),
                        req.payload().getName(),
                        req.payload().getIcon(),
                        req.payload().getColor(),
                        req.payload().getType()
                );
                return toJson(category);
            } catch (Exception e) {
                return "Error updating category: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Delete a custom category. Will be blocked if transactions or budgets are linked to it.")
    public Function<SingleCategoryRequest, String> deleteCategory() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                categoryService.delete(userId, req.categoryId());
                return "{\"success\": true, \"message\": \"Category deleted successfully\"}";
            } catch (Exception e) {
                return "Error deleting category: " + getMessage(e);
            }
        };
    }

    private String toJson(Object obj) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{\"error\": \"Could not serialize response\"}";
        }
    }

    private String getMessage(Exception e) {
        Throwable cause = NestedExceptionUtils.getRootCause(e);
        if (cause == null) cause = e;
        return cause.getMessage();
    }
}

package com.finsight.mcp.tool;

import com.finsight.api.service.BudgetService;
import com.finsight.common.dto.budget.BudgetResponse;
import com.finsight.common.dto.budget.BudgetResponse;
import com.finsight.common.dto.budget.CreateBudgetRequest;
import com.finsight.common.dto.budget.UpdateBudgetRequest;
import com.finsight.mcp.config.McpJwtAuthResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.springframework.core.NestedExceptionUtils;

import java.util.List;
import java.util.function.Function;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class BudgetTool {

    private final BudgetService budgetService;
    private final McpJwtAuthResolver authResolver;

    public record BudgetListRequest(String token) {}
    public record SingleBudgetRequest(String token, String budgetId) {}
    public record BudgetCreateRequest(String token, CreateBudgetRequest payload) {}
    public record BudgetUpdateRequest(String token, String budgetId, UpdateBudgetRequest payload) {}

    @Bean
    @Description("List all budgets with their current spending summary")
    public Function<BudgetListRequest, String> listBudgets() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                List<BudgetResponse> budgets = budgetService.getSummary(userId);
                return toJson(budgets);
            } catch (Exception e) {
                return "Error listing budgets: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Get a specific budget by its ID")
    public Function<SingleBudgetRequest, String> getBudget() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                BudgetResponse budget = budgetService.getById(userId, req.budgetId());
                return toJson(budget);
            } catch (Exception e) {
                return "Error getting budget: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Create a new budget for a specific category and period")
    public Function<BudgetCreateRequest, String> createBudget() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                BudgetResponse budget = budgetService.create(
                        userId, 
                        req.payload().getCategoryId(), 
                        req.payload().getAmount(), 
                        req.payload().getPeriod(),
                        req.payload().getAlertThreshold(),
                        req.payload().getIsActive()
                );
                return toJson(budget);
            } catch (Exception e) {
                return "Error creating budget: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Update an existing budget's amount or period")
    public Function<BudgetUpdateRequest, String> updateBudget() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                BudgetResponse budget = budgetService.update(
                        userId, 
                        req.budgetId(), 
                        req.payload().getCategoryId(),
                        req.payload().getAmount(), 
                        req.payload().getPeriod(),
                        req.payload().getAlertThreshold(),
                        req.payload().getIsActive()
                );
                return toJson(budget);
            } catch (Exception e) {
                return "Error updating budget: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Delete a budget")
    public Function<SingleBudgetRequest, String> deleteBudget() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                budgetService.delete(userId, req.budgetId());
                return "{\"success\": true, \"message\": \"Budget deleted successfully\"}";
            } catch (Exception e) {
                return "Error deleting budget: " + getMessage(e);
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

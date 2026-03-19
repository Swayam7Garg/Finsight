package com.finsight.mcp.tool;

import com.finsight.api.service.RecurringService;
import com.finsight.common.dto.recurring.CreateRecurringRuleRequest;
import com.finsight.common.dto.recurring.RecurringRuleResponse;
import com.finsight.common.dto.recurring.UpdateRecurringRuleRequest;
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
public class RecurringTool {

    private final RecurringService recurringService;
    private final McpJwtAuthResolver authResolver;

    public record RecurringListRequest(String token, String type, String accountId) {}
    public record SingleRecurringRequest(String token, String ruleId) {}
    public record RecurringCreateRequest(String token, CreateRecurringRuleRequest payload) {}
    public record RecurringUpdateRequest(String token, String ruleId, UpdateRecurringRuleRequest payload) {}

    @Bean
    @Description("List all recurring transaction rules (bills and income)")
    public Function<RecurringListRequest, String> listRecurringRules() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                List<RecurringRuleResponse> rules = recurringService.list(userId);
                return toJson(rules);
            } catch (Exception e) {
                return "Error listing recurring rules: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("List upcoming recurring bills and income for the next 30 days")
    public Function<RecurringListRequest, String> getUpcomingRules() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                List<RecurringRuleResponse> rules = recurringService.getUpcoming(userId);
                return toJson(rules);
            } catch (Exception e) {
                return "Error listing upcoming rules: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Get a specific recurring rule by its ID")
    public Function<SingleRecurringRequest, String> getRecurringRule() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                RecurringRuleResponse rule = recurringService.getById(userId, req.ruleId());
                return toJson(rule);
            } catch (Exception e) {
                return "Error getting recurring rule: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Create a new recurring transaction rule (e.g., monthly rent, weekly salary)")
    public Function<RecurringCreateRequest, String> createRecurringRule() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                RecurringRuleResponse rule = recurringService.create(
                        userId,
                        req.payload().getAccountId(),
                        req.payload().getCategoryId(),
                        req.payload().getType(),
                        req.payload().getAmount(),
                        req.payload().getDescription(),
                        req.payload().getFrequency(),
                        req.payload().getStartDate(),
                        req.payload().getEndDate()
                );
                return toJson(rule);
            } catch (Exception e) {
                return "Error creating recurring rule: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Update a recurring rule. Status can be active or paused.")
    public Function<RecurringUpdateRequest, String> updateRecurringRule() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                RecurringRuleResponse rule = recurringService.update(
                        userId,
                        req.ruleId(),
                        req.payload().getAccountId(),
                        req.payload().getCategoryId(),
                        req.payload().getType(),
                        req.payload().getAmount(),
                        req.payload().getDescription(),
                        req.payload().getFrequency(),
                        req.payload().getStartDate(),
                        req.payload().getEndDate(),
                        req.payload().getIsActive()
                );
                return toJson(rule);
            } catch (Exception e) {
                return "Error updating recurring rule: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Mark a recurring rule as paid. This generates a transaction and advances the nextDueDate.")
    public Function<SingleRecurringRequest, String> markRecurringRuleAsPaid() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                java.util.Map<String, Object> result = recurringService.markAsPaid(userId, req.ruleId());
                return toJson(result);
            } catch (Exception e) {
                return "Error marking as paid: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Delete a recurring rule")
    public Function<SingleRecurringRequest, String> deleteRecurringRule() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                recurringService.delete(userId, req.ruleId());
                return "{\"success\": true, \"message\": \"Recurring rule deleted successfully\"}";
            } catch (Exception e) {
                return "Error deleting recurring rule: " + getMessage(e);
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

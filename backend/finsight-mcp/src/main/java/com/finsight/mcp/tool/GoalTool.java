package com.finsight.mcp.tool;

import com.finsight.api.service.GoalService;
import com.finsight.common.dto.goal.CreateGoalRequest;
import com.finsight.common.dto.goal.GoalResponse;
import com.finsight.common.dto.goal.UpdateGoalRequest;
import com.finsight.mcp.config.McpJwtAuthResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.springframework.core.NestedExceptionUtils;

import java.time.Instant;
import java.util.List;
import java.util.function.Function;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class GoalTool {

    private final GoalService goalService;
    private final McpJwtAuthResolver authResolver;

    public record GoalListRequest(String token, String status) {}
    public record SingleGoalRequest(String token, String goalId) {}
    public record GoalCreateRequest(String token, CreateGoalRequest payload) {}
    public record GoalUpdateRequest(String token, String goalId, UpdateGoalRequest payload) {}
    public record GoalAddFundsRequest(String token, String goalId, Double amount) {}

    @Bean
    @Description("List all financial goals")
    public Function<GoalListRequest, String> listGoals() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                List<GoalResponse> goals = goalService.list(userId);
                return toJson(goals);
            } catch (Exception e) {
                return "Error listing goals: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Get a specific goal by its ID")
    public Function<SingleGoalRequest, String> getGoal() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                GoalResponse goal = goalService.getById(userId, req.goalId());
                return toJson(goal);
            } catch (Exception e) {
                return "Error getting goal: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Create a new financial savings goal")
    public Function<GoalCreateRequest, String> createGoal() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                GoalResponse goal = goalService.create(
                        userId,
                        req.payload().getName(),
                        req.payload().getTargetAmount(),
                        req.payload().getCurrentAmount(),
                        req.payload().getDeadline(),
                        req.payload().getColor(),
                        req.payload().getIcon()
                );
                return toJson(goal);
            } catch (Exception e) {
                return "Error creating goal: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Update an existing goal's details")
    public Function<GoalUpdateRequest, String> updateGoal() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                GoalResponse goal = goalService.update(
                        userId,
                        req.goalId(),
                        req.payload().getName(),
                        req.payload().getTargetAmount(),
                        req.payload().getCurrentAmount(),
                        req.payload().getDeadline(),
                        req.payload().getColor(),
                        req.payload().getIcon(),
                        req.payload().getIsCompleted()
                );
                return toJson(goal);
            } catch (Exception e) {
                return "Error updating goal: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Add saved funds to a goal instance. Automatically completes the goal if the target is reached.")
    public Function<GoalAddFundsRequest, String> addFundsToGoal() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                GoalResponse goal = goalService.addFunds(userId, req.goalId(), req.amount());
                return toJson(goal);
            } catch (Exception e) {
                return "Error adding funds to goal: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Delete a goal")
    public Function<SingleGoalRequest, String> deleteGoal() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                goalService.delete(userId, req.goalId());
                return "{\"success\": true, \"message\": \"Goal deleted successfully\"}";
            } catch (Exception e) {
                return "Error deleting goal: " + getMessage(e);
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

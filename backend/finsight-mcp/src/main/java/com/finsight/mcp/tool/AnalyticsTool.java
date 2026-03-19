package com.finsight.mcp.tool;

import com.finsight.api.service.AnalyticsService;
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
public class AnalyticsTool {

    private final AnalyticsService analyticsService;
    private final McpJwtAuthResolver authResolver;

    public record PeriodAnalyticsRequest(String token, String period) {}
    public record CustomPeriodAnalyticsRequest(String token, String startDate, String endDate) {}

    @Bean
    @Description("Get the overall financial summary (total balance, income, expenses) for a given period")
    public Function<PeriodAnalyticsRequest, String> getSummary() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                // In Java version, getMonthlySummary is used or we can use getSpendingTrend
                Map<String, Object> summary = analyticsService.getSpendingTrend(userId, req.period());
                return toJson(summary);
            } catch (Exception e) {
                return "Error getting summary: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Get spending breakdown by category for a given period")
    public Function<CustomPeriodAnalyticsRequest, String> getSpendingByCategory() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                List<Map<String, Object>> spending = analyticsService.getSpendingByCategory(userId, req.startDate(), req.endDate());
                return toJson(spending);
            } catch (Exception e) {
                return "Error getting spending by category: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Get a comparison of income vs expenses by month/day over a given period")
    public Function<CustomPeriodAnalyticsRequest, String> getIncomeVsExpense() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                Map<String, Object> incomeVsExpense = analyticsService.getIncomeVsExpense(userId, req.startDate(), req.endDate());
                return toJson(incomeVsExpense);
            } catch (Exception e) {
                return "Error getting income vs expense: " + getMessage(e);
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

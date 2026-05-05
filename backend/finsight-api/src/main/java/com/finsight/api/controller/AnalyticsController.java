package com.finsight.api.controller;

import com.finsight.api.service.AnalyticsService;
import com.finsight.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Financial analytics and insights")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/spending-by-category")
    @Operation(summary = "Get spending breakdown by category")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> spendingByCategory(
            Authentication auth,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.getSpendingByCategory(auth.getName(), startDate, endDate)));
    }

    @GetMapping("/income-vs-expense")
    @Operation(summary = "Get income vs expense totals")
    public ResponseEntity<ApiResponse<Map<String, Object>>> incomeVsExpense(
            Authentication auth,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.getIncomeVsExpense(auth.getName(), startDate, endDate)));
    }

    @GetMapping("/monthly-summary")
    @Operation(summary = "Get monthly income/expense summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> monthlySummary(
            Authentication auth,
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.getMonthlySummary(auth.getName(), months)));
    }

    @GetMapping("/spending-trend")
    @Operation(summary = "Get spending trend analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> spendingTrend(
            Authentication auth,
            @RequestParam(defaultValue = "half_year") String period) {
        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.getSpendingTrend(auth.getName(), period)));
    }

    @GetMapping("/net-worth")
    @Operation(summary = "Get net worth based on account balances")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> netWorth(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getNetWorth(auth.getName())));
    }

    @GetMapping("/spending-by-day")
    @Operation(summary = "Get spending by day of week")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> spendingByDay(
            Authentication auth,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.getSpendingByDayOfWeek(auth.getName(), startDate, endDate)));
    }

    @GetMapping("/monthly-category-breakdown")
    @Operation(summary = "Get category breakdown for a specific month")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> monthlyCategoryBreakdown(
            Authentication auth,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        int y = year != null ? year : LocalDate.now().getYear();
        int m = month != null ? month : LocalDate.now().getMonthValue();
        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.getMonthlyCategoryBreakdown(auth.getName(), y, m)));
    }
}

package com.finsight.api.service;

import com.finsight.api.repository.BudgetRepository;
import com.finsight.common.dto.budget.BudgetResponse;
import com.finsight.common.exception.ApiException;
import com.finsight.common.model.Budget;
import com.finsight.common.model.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final MongoTemplate mongoTemplate;

    public List<BudgetResponse> list(String userId) {
        return budgetRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    public BudgetResponse getById(String userId, String budgetId) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> ApiException.notFound("Budget not found"));
        return toResponse(budget);
    }

    public BudgetResponse create(String userId, String categoryId, double amount,
                                  String period, Double alertThreshold, Boolean isActive) {
        Budget budget = Budget.builder()
                .userId(userId)
                .categoryId(categoryId)
                .amount(amount)
                .period(period)
                .alertThreshold(alertThreshold != null ? alertThreshold : 0.8)
                .isActive(isActive != null ? isActive : true)
                .build();
        return toResponse(budgetRepository.save(budget));
    }

    public BudgetResponse update(String userId, String budgetId,
                                  String categoryId, Double amount,
                                  String period, Double alertThreshold, Boolean isActive) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> ApiException.notFound("Budget not found"));

        if (categoryId != null) budget.setCategoryId(categoryId);
        if (amount != null) budget.setAmount(amount);
        if (period != null) budget.setPeriod(period);
        if (alertThreshold != null) budget.setAlertThreshold(alertThreshold);
        if (isActive != null) budget.setActive(isActive);

        return toResponse(budgetRepository.save(budget));
    }

    public BudgetResponse delete(String userId, String budgetId) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> ApiException.notFound("Budget not found"));
        budgetRepository.delete(budget);
        return toResponse(budget);
    }

    public List<BudgetResponse> getSummary(String userId) {
        List<Budget> budgets = budgetRepository.findByUserIdAndIsActive(userId, true);

        return budgets.stream().map(budget -> {
            Instant periodStart = getPeriodStartDate(budget.getPeriod());
            Instant now = Instant.now();

            Aggregation agg = Aggregation.newAggregation(
                    Aggregation.match(Criteria.where("userId").is(userId)
                            .and("categoryId").is(budget.getCategoryId())
                            .and("type").is("expense")
                            .and("date").gte(periodStart).lte(now)),
                    Aggregation.group().sum("amount").as("totalSpent")
            );

            AggregationResults<Map> results = mongoTemplate.aggregate(agg, "transactions", Map.class);
            double spent = 0;
            if (!results.getMappedResults().isEmpty()) {
                Object totalSpent = results.getMappedResults().get(0).get("totalSpent");
                if (totalSpent instanceof Number) spent = ((Number) totalSpent).doubleValue();
            }

            double percentage = budget.getAmount() > 0 ? spent / budget.getAmount() : 0;
            String status;
            if (percentage >= 1) status = "over_budget";
            else if (percentage >= budget.getAlertThreshold()) status = "warning";
            else status = "under_budget";

            BudgetResponse resp = toResponse(budget);
            resp.setSpent(spent);
            resp.setPercentage(Math.round(percentage * 10000.0) / 10000.0);
            resp.setStatus(status);
            return resp;
        }).toList();
    }

    private Instant getPeriodStartDate(String period) {
        LocalDate now = LocalDate.now();
        if ("monthly".equals(period)) {
            return now.withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        }
        // Weekly: start from most recent Monday
        LocalDate monday = now.with(DayOfWeek.MONDAY);
        if (monday.isAfter(now)) monday = monday.minusWeeks(1);
        return monday.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private BudgetResponse toResponse(Budget budget) {
        return BudgetResponse.builder()
                .id(budget.getId())
                .userId(budget.getUserId())
                .categoryId(budget.getCategoryId())
                .amount(budget.getAmount())
                .period(budget.getPeriod())
                .alertThreshold(budget.getAlertThreshold())
                .isActive(budget.isActive())
                .createdAt(budget.getCreatedAt() != null ? budget.getCreatedAt().toString() : null)
                .updatedAt(budget.getUpdatedAt() != null ? budget.getUpdatedAt().toString() : null)
                .build();
    }
}

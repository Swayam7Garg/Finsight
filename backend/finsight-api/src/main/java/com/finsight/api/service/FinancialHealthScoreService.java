package com.finsight.api.service;

import com.finsight.api.repository.GoalRepository;
import com.finsight.api.repository.TransactionRepository;
import com.finsight.common.dto.analytics.FinancialHealthBreakdownItem;
import com.finsight.common.dto.analytics.FinancialHealthRecommendation;
import com.finsight.common.dto.analytics.FinancialHealthScoreResponse;
import com.finsight.common.dto.budget.BudgetResponse;
import com.finsight.common.model.Goal;
import com.finsight.common.model.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinancialHealthScoreService {

    private static final int CASH_FLOW_MAX = 35;
    private static final int BUDGET_MAX = 25;
    private static final int GOALS_MAX = 25;
    private static final int ACTIVITY_MAX = 15;

    private final AnalyticsService analyticsService;
    private final BudgetService budgetService;
    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;
    private final MongoTemplate mongoTemplate;

    public FinancialHealthScoreResponse calculate(String userId) {
        List<FinancialHealthRecommendation> recommendations = new ArrayList<>();
        List<FinancialHealthBreakdownItem> breakdown = new ArrayList<>();

        Instant end = Instant.now();
        Instant start = LocalDate.now().minusDays(90).atStartOfDay(ZoneOffset.UTC).toInstant();

        FinancialHealthBreakdownItem cashFlow = scoreCashFlow(userId, start, end, recommendations);
        FinancialHealthBreakdownItem budgets = scoreBudgets(userId, recommendations);
        FinancialHealthBreakdownItem goals = scoreGoals(userId, recommendations);
        FinancialHealthBreakdownItem activity = scoreActivity(userId, start, recommendations);

        breakdown.add(cashFlow);
        breakdown.add(budgets);
        breakdown.add(goals);
        breakdown.add(activity);

        int total = clamp(breakdown.stream().mapToInt(FinancialHealthBreakdownItem::getScore).sum(), 0, 100);

        if (recommendations.isEmpty()) {
            recommendations.add(FinancialHealthRecommendation.builder()
                    .key("maintain-momentum")
                    .title("Keep the momentum going")
                    .description("Your financial signals look strong. Keep reviewing budgets, goals, and cash flow regularly.")
                    .priority("low")
                    .build());
        }

        return FinancialHealthScoreResponse.builder()
                .score(total)
                .grade(toGrade(total))
                .breakdown(breakdown)
                .recommendations(recommendations)
                .calculatedAt(Instant.now().toString())
                .build();
    }

    private FinancialHealthBreakdownItem scoreCashFlow(
            String userId,
            Instant start,
            Instant end,
            List<FinancialHealthRecommendation> recommendations) {
        Map<String, Object> totals = analyticsService.getIncomeVsExpense(userId, start.toString(), end.toString());
        double income = asDouble(totals.get("income"));
        double expense = asDouble(totals.get("expense"));
        double net = income - expense;

        int score;
        String status;
        String detail;

        if (income <= 0 && expense <= 0) {
            score = 10;
            status = "needs_data";
            detail = "Add income and expense transactions to improve score accuracy.";
            recommendations.add(recommendation(
                    "add-transactions",
                    "Add recent transactions",
                    "The score becomes more useful after you track income and expenses for the current period.",
                    "medium"));
        } else if (income <= 0) {
            score = 5;
            status = "at_risk";
            detail = "Recent expenses were found, but no income was recorded.";
            recommendations.add(recommendation(
                    "record-income",
                    "Record income sources",
                    "Add income transactions so cash flow and savings rate can be measured correctly.",
                    "high"));
        } else {
            double savingsRate = net / income;
            if (savingsRate >= 0.30) {
                score = CASH_FLOW_MAX;
                status = "excellent";
            } else if (savingsRate >= 0.20) {
                score = 30;
                status = "good";
            } else if (savingsRate >= 0.10) {
                score = 25;
                status = "fair";
            } else if (savingsRate >= 0) {
                score = 18;
                status = "watch";
            } else if (savingsRate >= -0.10) {
                score = 10;
                status = "at_risk";
            } else {
                score = 5;
                status = "critical";
            }

            detail = String.format("Your 90-day savings rate is %.1f%%.", savingsRate * 100);
            if (savingsRate < 0.10) {
                recommendations.add(recommendation(
                        "improve-savings-rate",
                        "Improve your savings rate",
                        "Aim to keep expenses below 90% of income, then gradually work toward saving at least 20%.",
                        savingsRate < 0 ? "high" : "medium"));
            }
        }

        return FinancialHealthBreakdownItem.builder()
                .key("cashFlow")
                .label("Cash Flow")
                .score(score)
                .maxScore(CASH_FLOW_MAX)
                .status(status)
                .detail(detail)
                .build();
    }

    private FinancialHealthBreakdownItem scoreBudgets(
            String userId,
            List<FinancialHealthRecommendation> recommendations) {
        List<BudgetResponse> budgets = budgetService.getSummary(userId);

        if (budgets.isEmpty()) {
            recommendations.add(recommendation(
                    "create-budgets",
                    "Create active budgets",
                    "Budgets help the score measure whether spending is staying within your plan.",
                    "medium"));
            return FinancialHealthBreakdownItem.builder()
                    .key("budgets")
                    .label("Budget Health")
                    .score(12)
                    .maxScore(BUDGET_MAX)
                    .status("needs_data")
                    .detail("No active budgets are available for scoring.")
                    .build();
        }

        long overBudget = budgets.stream().filter(b -> "over_budget".equals(b.getStatus())).count();
        long warnings = budgets.stream().filter(b -> "warning".equals(b.getStatus())).count();
        double averageRatio = budgets.stream()
                .mapToDouble(b -> {
                    if ("over_budget".equals(b.getStatus())) return 0.20;
                    if ("warning".equals(b.getStatus())) return 0.65;
                    double percentage = b.getPercentage() != null ? b.getPercentage() : 0;
                    return percentage <= 0.75 ? 1.0 : 0.85;
                })
                .average()
                .orElse(0.5);

        int score = clamp((int) Math.round(averageRatio * BUDGET_MAX), 0, BUDGET_MAX);
        String status = overBudget > 0 ? "at_risk" : warnings > 0 ? "watch" : "good";
        String detail = String.format("%d active budget(s), %d warning(s), %d over budget.", budgets.size(), warnings, overBudget);

        if (overBudget > 0) {
            recommendations.add(recommendation(
                    "review-over-budget",
                    "Review over-budget categories",
                    "Reduce spending in categories that have crossed their budget or adjust the budget if it is unrealistic.",
                    "high"));
        } else if (warnings > 0) {
            recommendations.add(recommendation(
                    "watch-budget-warnings",
                    "Watch categories near the limit",
                    "Some budgets are close to their alert threshold. Check them before they cross the limit.",
                    "medium"));
        }

        return FinancialHealthBreakdownItem.builder()
                .key("budgets")
                .label("Budget Health")
                .score(score)
                .maxScore(BUDGET_MAX)
                .status(status)
                .detail(detail)
                .build();
    }

    private FinancialHealthBreakdownItem scoreGoals(
            String userId,
            List<FinancialHealthRecommendation> recommendations) {
        List<Goal> goals = goalRepository.findByUserIdOrderByCreatedAtDesc(userId);

        if (goals.isEmpty()) {
            recommendations.add(recommendation(
                    "create-goals",
                    "Create savings goals",
                    "Goals give the score a way to measure progress toward future financial milestones.",
                    "medium"));
            return FinancialHealthBreakdownItem.builder()
                    .key("goals")
                    .label("Goal Progress")
                    .score(12)
                    .maxScore(GOALS_MAX)
                    .status("needs_data")
                    .detail("No goals are available for scoring.")
                    .build();
        }

        double averageProgress = goals.stream()
                .mapToDouble(goal -> {
                    if (goal.isCompleted()) return 1.0;
                    if (goal.getTargetAmount() <= 0) return 0.0;
                    return Math.min(goal.getCurrentAmount() / goal.getTargetAmount(), 1.0);
                })
                .average()
                .orElse(0);

        long completed = goals.stream().filter(Goal::isCompleted).count();
        int score = clamp((int) Math.round(averageProgress * GOALS_MAX), 0, GOALS_MAX);
        String status = averageProgress >= 0.75 ? "good" : averageProgress >= 0.40 ? "watch" : "at_risk";
        String detail = String.format("%d of %d goal(s) completed, with %.1f%% average progress.",
                completed, goals.size(), averageProgress * 100);

        if (averageProgress < 0.40) {
            recommendations.add(recommendation(
                    "fund-goals",
                    "Add funds toward your goals",
                    "Small recurring contributions can make goal progress more consistent.",
                    "medium"));
        }

        return FinancialHealthBreakdownItem.builder()
                .key("goals")
                .label("Goal Progress")
                .score(score)
                .maxScore(GOALS_MAX)
                .status(status)
                .detail(detail)
                .build();
    }

    private FinancialHealthBreakdownItem scoreActivity(
            String userId,
            Instant start,
            List<FinancialHealthRecommendation> recommendations) {
        long totalTransactions = transactionRepository.countByUserId(userId);
        long recentTransactions = mongoTemplate.count(
                new Query(Criteria.where("userId").is(userId).and("date").gte(start)),
                Transaction.class);

        int score;
        String status;
        if (totalTransactions == 0) {
            score = 3;
            status = "needs_data";
        } else if (recentTransactions >= 20) {
            score = ACTIVITY_MAX;
            status = "good";
        } else if (recentTransactions >= 10) {
            score = 12;
            status = "fair";
        } else if (recentTransactions >= 5) {
            score = 9;
            status = "watch";
        } else {
            score = 6;
            status = "needs_data";
        }

        if (recentTransactions < 10) {
            recommendations.add(recommendation(
                    "track-consistently",
                    "Track transactions consistently",
                    "Regular transaction history makes the score more reliable and helps reveal spending patterns.",
                    totalTransactions == 0 ? "high" : "low"));
        }

        return FinancialHealthBreakdownItem.builder()
                .key("activity")
                .label("Tracking Consistency")
                .score(score)
                .maxScore(ACTIVITY_MAX)
                .status(status)
                .detail(String.format("%d transaction(s) recorded in the last 90 days.", recentTransactions))
                .build();
    }

    private FinancialHealthRecommendation recommendation(
            String key,
            String title,
            String description,
            String priority) {
        return FinancialHealthRecommendation.builder()
                .key(key)
                .title(title)
                .description(description)
                .priority(priority)
                .build();
    }

    private double asDouble(Object value) {
        return value instanceof Number number ? number.doubleValue() : 0;
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private String toGrade(int score) {
        if (score >= 80) return "A";
        if (score >= 65) return "B";
        if (score >= 50) return "C";
        if (score >= 35) return "D";
        return "F";
    }
}

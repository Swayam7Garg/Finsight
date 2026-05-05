package com.finsight.api.service;

import com.finsight.common.model.Transaction;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final MongoTemplate mongoTemplate;

    public List<Map<String, Object>> getSpendingByCategory(String userId, String startDate, String endDate) {
        Criteria criteria = buildDateCriteria(userId, startDate, endDate).and("type").is("expense");

        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.group("categoryId")
                        .sum("amount").as("total")
                        .count().as("count"),
                Aggregation.sort(Sort.Direction.DESC, "total")
        );

        return mongoTemplate.aggregate(agg, "transactions", Map.class)
                .getMappedResults().stream().map(m -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("categoryId", m.get("_id"));
                    result.put("total", m.get("total"));
                    result.put("count", m.get("count"));
                    return result;
                }).toList();
    }

    public Map<String, Object> getIncomeVsExpense(String userId, String startDate, String endDate) {
        Criteria criteria = buildDateCriteria(userId, startDate, endDate);

        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.group("type").sum("amount").as("total")
        );

        List<Map> results = mongoTemplate.aggregate(agg, "transactions", Map.class).getMappedResults();

        double income = 0, expense = 0;
        for (Map r : results) {
            String type = (String) r.get("_id");
            double total = ((Number) r.get("total")).doubleValue();
            if ("income".equals(type)) income = total;
            else if ("expense".equals(type)) expense = total;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("income", income);
        response.put("expense", expense);
        response.put("net", income - expense);
        return response;
    }

    public List<Map<String, Object>> getMonthlySummary(String userId, int months) {
        LocalDate now = LocalDate.now();
        LocalDate startMonth = now.minusMonths(months - 1).withDayOfMonth(1);
        Instant startDate = startMonth.atStartOfDay(ZoneOffset.UTC).toInstant();

        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("userId").is(userId).and("date").gte(startDate)),
                Aggregation.project("type", "amount", "date")
                        .andExpression("year(date)").as("year")
                        .andExpression("month(date)").as("month"),
                Aggregation.group(Fields.fields().and("year").and("month").and("type"))
                        .sum("amount").as("total"),
                Aggregation.sort(Sort.Direction.ASC, "_id.year", "_id.month")
        );

        List<Map> rawResults = mongoTemplate.aggregate(agg, "transactions", Map.class).getMappedResults();

        // Group by year-month
        Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (Map r : rawResults) {
            Map<String, Object> id = (Map<String, Object>) r.get("_id");
            String key = id.get("year") + "-" + String.format("%02d", ((Number) id.get("month")).intValue());
            String type = (String) id.get("type");
            double total = ((Number) r.get("total")).doubleValue();

            grouped.computeIfAbsent(key, k -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("month", k);
                entry.put("income", 0.0);
                entry.put("expense", 0.0);
                return entry;
            });
            grouped.get(key).put(type, total);
        }

        return new ArrayList<>(grouped.values());
    }

    public Map<String, Object> getSpendingTrend(String userId, String period) {
        int months = "quarterly".equals(period) ? 3 : ("yearly".equals(period) ? 12 : 6);

        List<Map<String, Object>> monthly = getMonthlySummary(userId, months);
        List<Double> expenseTrend = monthly.stream()
                .map(m -> ((Number) m.getOrDefault("expense", 0.0)).doubleValue()).toList();

        double average = expenseTrend.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        String trend = "stable";
        if (expenseTrend.size() >= 2) {
            double recent = expenseTrend.get(expenseTrend.size() - 1);
            double previous = expenseTrend.get(expenseTrend.size() - 2);
            if (recent > previous * 1.1) trend = "increasing";
            else if (recent < previous * 0.9) trend = "decreasing";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("period", period != null ? period : "half_year");
        response.put("data", monthly);
        response.put("trend", trend);
        response.put("averageMonthly", Math.round(average * 100.0) / 100.0);
        return response;
    }

    public List<Map<String, Object>> getNetWorth(String userId) {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("userId").is(userId).and("isArchived").is(false)),
                Aggregation.group().sum("balance").as("totalBalance")
        );

        List<Map> results = mongoTemplate.aggregate(agg, "accounts", Map.class).getMappedResults();
        double total = results.isEmpty() ? 0 : ((Number) results.get(0).get("totalBalance")).doubleValue();

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("date", Instant.now().toString());
        entry.put("netWorth", total);
        return List.of(entry);
    }

    public List<Map<String, Object>> getSpendingByDayOfWeek(String userId, String startDate, String endDate) {
        Criteria criteria = buildDateCriteria(userId, startDate, endDate).and("type").is("expense");

        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.project("amount", "date")
                        .andExpression("dayOfWeek(date)").as("dayOfWeek"),
                Aggregation.group("dayOfWeek")
                        .sum("amount").as("total")
                        .count().as("count"),
                Aggregation.sort(Sort.Direction.ASC, "_id")
        );

        String[] dayNames = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};

        return mongoTemplate.aggregate(agg, "transactions", Map.class)
                .getMappedResults().stream().map(m -> {
                    int dayIdx = ((Number) m.get("_id")).intValue() - 1;
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("day", dayIdx >= 0 && dayIdx < 7 ? dayNames[dayIdx] : "Unknown");
                    result.put("total", m.get("total"));
                    result.put("count", m.get("count"));
                    return result;
                }).toList();
    }

    public List<Map<String, Object>> getMonthlyCategoryBreakdown(String userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1);
        Instant startDate = start.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endDate = end.atStartOfDay(ZoneOffset.UTC).toInstant();

        Criteria criteria = Criteria.where("userId").is(userId)
                .and("type").is("expense")
                .and("date").gte(startDate).lt(endDate);

        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.group("categoryId")
                        .sum("amount").as("total")
                        .count().as("count"),
                Aggregation.sort(Sort.Direction.DESC, "total")
        );

        return mongoTemplate.aggregate(agg, "transactions", Map.class)
                .getMappedResults().stream().map(m -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("categoryId", m.get("_id"));
                    result.put("total", m.get("total"));
                    result.put("count", m.get("count"));
                    return result;
                }).toList();
    }

    private Criteria buildDateCriteria(String userId, String startDate, String endDate) {
        Criteria criteria = Criteria.where("userId").is(userId);
        if (startDate != null) criteria = criteria.and("date").gte(Instant.parse(startDate));
        if (endDate != null) {
            if (startDate != null) {
                criteria = Criteria.where("userId").is(userId)
                        .and("date").gte(Instant.parse(startDate)).lte(Instant.parse(endDate));
            } else {
                criteria = criteria.and("date").lte(Instant.parse(endDate));
            }
        }
        return criteria;
    }
}

package com.finsight.api.service;

import com.finsight.api.repository.*;
import com.finsight.common.exception.ApiException;
import com.finsight.common.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final MongoTemplate mongoTemplate;

    public List<Map<String, Object>> list(String userId) {
        Query query = new Query(new Criteria().orOperator(
                Criteria.where("userId").is(null),
                Criteria.where("userId").is(userId)
        )).with(org.springframework.data.domain.Sort.by("type", "name"));

        List<Category> categories = mongoTemplate.find(query, Category.class);
        return enrichCategories(userId, categories);
    }

    public Map<String, Object> getById(String userId, String categoryId) {
        Category category = getCategoryOrThrow(userId, categoryId);
        List<Map<String, Object>> enriched = enrichCategories(userId, List.of(category));
        return enriched.isEmpty() ? Map.of() : enriched.get(0);
    }

    public Map<String, Object> create(String userId, String name, String icon, String color, String type) {
        Category category = Category.builder()
                .userId(userId)
                .name(name)
                .icon(icon)
                .color(color)
                .type(type)
                .isDefault(false)
                .build();
        category = mongoTemplate.save(category);
        return getById(userId, category.getId());
    }

    public Map<String, Object> update(String userId, String categoryId, String name, String icon, String color, String type) {
        Category category = getCategoryOrThrow(userId, categoryId);

        if (category.isDefault() && category.getUserId() == null) {
            throw ApiException.forbidden("System default categories cannot be modified");
        }
        if (category.getUserId() != null && !category.getUserId().equals(userId)) {
            throw ApiException.notFound("Category not found");
        }

        if (name != null) category.setName(name);
        if (icon != null) category.setIcon(icon);
        if (color != null) category.setColor(color);
        if (type != null) category.setType(type);

        mongoTemplate.save(category);
        return getById(userId, categoryId);
    }

    public Map<String, Object> remove(String userId, String categoryId) {
        Category category = getCategoryOrThrow(userId, categoryId);

        if (category.isDefault() && category.getUserId() == null) {
            throw ApiException.forbidden("System default categories cannot be deleted");
        }
        if (category.getUserId() != null && !category.getUserId().equals(userId)) {
            throw ApiException.notFound("Category not found");
        }

        Map<String, Object> enriched = getById(userId, categoryId);
        @SuppressWarnings("unchecked")
        Map<String, Object> usage = (Map<String, Object>) enriched.get("usage");
        if (usage != null && !(Boolean) usage.getOrDefault("canDelete", true)) {
            throw ApiException.conflict("Category cannot be deleted while it is still in use",
                    Map.of("categoryId", categoryId,
                           "deleteBlockers", enriched.get("deleteBlockers"),
                           "usage", usage));
        }

        mongoTemplate.remove(category);
        return enriched;
    }

    public Map<String, Object> delete(String userId, String categoryId) {
        return remove(userId, categoryId);
    }

    private Category getCategoryOrThrow(String userId, String categoryId) {
        Category category = mongoTemplate.findById(categoryId, Category.class);
        if (category == null) throw ApiException.notFound("Category not found");

        boolean isOwner = userId.equals(category.getUserId());
        boolean isDefault = category.isDefault() && category.getUserId() == null;
        if (!isOwner && !isDefault) throw ApiException.notFound("Category not found");

        return category;
    }

    private List<Map<String, Object>> enrichCategories(String userId, List<Category> categories) {
        if (categories.isEmpty()) return List.of();

        List<String> categoryIds = categories.stream().map(Category::getId).toList();
        Instant monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        // Transaction stats
        Aggregation txAgg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("userId").is(userId).and("categoryId").in(categoryIds)),
                Aggregation.group("categoryId")
                        .count().as("transactionCount")
                        .max("date").as("lastTransactionAt")
                        .sum(ConditionalOperators
                                .when(Criteria.where("type").is("expense").and("date").gte(monthStart))
                                .thenValueOf("$amount").otherwise(0)).as("spentThisMonth")
        );
        List<Map> txStats = mongoTemplate.aggregate(txAgg, "transactions", Map.class).getMappedResults();
        Map<String, Map> txMap = new HashMap<>();
        for (Map s : txStats) txMap.put(s.get("_id").toString(), s);

        // Budget counts
        List<Budget> budgets = mongoTemplate.find(
                new Query(Criteria.where("userId").is(userId).and("categoryId").in(categoryIds)), Budget.class);
        Map<String, List<Map<String, Object>>> budgetMap = new HashMap<>();
        for (Budget b : budgets) {
            budgetMap.computeIfAbsent(b.getCategoryId(), k -> new ArrayList<>()).add(Map.of(
                    "id", b.getId(), "amount", b.getAmount(), "period", b.getPeriod(),
                    "alertThreshold", b.getAlertThreshold(), "isActive", b.isActive()));
        }

        // Recurring rule counts
        List<RecurringRule> rules = mongoTemplate.find(
                new Query(Criteria.where("userId").is(userId).and("categoryId").in(categoryIds)), RecurringRule.class);
        Map<String, List<Map<String, Object>>> recurringMap = new HashMap<>();
        for (RecurringRule r : rules) {
            recurringMap.computeIfAbsent(r.getCategoryId(), k -> new ArrayList<>()).add(Map.of(
                    "id", r.getId(), "description", r.getDescription(), "amount", r.getAmount(),
                    "frequency", r.getFrequency(), "nextDueDate", r.getNextDueDate().toString(),
                    "isActive", r.isActive(), "type", r.getType()));
        }

        return categories.stream().map(cat -> {
            String key = cat.getId();
            Map txData = txMap.getOrDefault(key, Map.of());
            List<Map<String, Object>> lb = budgetMap.getOrDefault(key, List.of());
            List<Map<String, Object>> lr = recurringMap.getOrDefault(key, List.of());

            int txCount = txData.containsKey("transactionCount") ? ((Number) txData.get("transactionCount")).intValue() : 0;
            double spentMonth = txData.containsKey("spentThisMonth") ? ((Number) txData.get("spentThisMonth")).doubleValue() : 0;
            Object lastTx = txData.get("lastTransactionAt");

            List<String> deleteBlockers = new ArrayList<>();
            if (cat.isDefault() && cat.getUserId() == null) deleteBlockers.add("Built-in categories cannot be deleted.");
            if (txCount > 0) deleteBlockers.add("Linked to " + txCount + " transaction" + (txCount == 1 ? "" : "s") + ".");
            if (!lb.isEmpty()) deleteBlockers.add("Used by " + lb.size() + " budget" + (lb.size() == 1 ? "" : "s") + ".");
            if (!lr.isEmpty()) deleteBlockers.add("Used by " + lr.size() + " recurring rule" + (lr.size() == 1 ? "" : "s") + ".");

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", cat.getId());
            result.put("userId", cat.getUserId());
            result.put("name", cat.getName());
            result.put("icon", cat.getIcon());
            result.put("color", cat.getColor());
            result.put("type", cat.getType());
            result.put("isDefault", cat.isDefault());
            result.put("createdAt", cat.getCreatedAt() != null ? cat.getCreatedAt().toString() : null);
            result.put("usage", Map.of(
                    "transactionCount", txCount,
                    "budgetCount", lb.size(),
                    "activeBudgetCount", lb.stream().filter(b -> (Boolean) b.get("isActive")).count(),
                    "recurringCount", lr.size(),
                    "activeRecurringCount", lr.stream().filter(r -> (Boolean) r.get("isActive")).count(),
                    "spentThisMonth", spentMonth,
                    "lastTransactionAt", lastTx != null ? lastTx.toString() : null,
                    "canDelete", deleteBlockers.isEmpty()
            ));
            result.put("linkedBudgets", lb);
            result.put("linkedRecurringRules", lr);
            result.put("deleteBlockers", deleteBlockers);
            return result;
        }).toList();
    }
}

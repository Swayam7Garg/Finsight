package com.finsight.api.service;

import com.finsight.common.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class CategoryServiceTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private MongoTemplate mongoTemplate;

    @SuppressWarnings("unchecked")
    @Test
    void testListCategoriesWithNullFieldsAndNoTransactions() {
        String testUserId = "test-user-" + UUID.randomUUID();

        // 1. Create a category for this user
        Category category = Category.builder()
                .userId(testUserId)
                .name("Test Category")
                .icon("test-icon")
                .color("#123456")
                .type("expense")
                .isDefault(false)
                .createdAt(null) // Test null createdAt
                .build();
        final Category savedCategory = mongoTemplate.save(category);

        // 2. Create a recurring rule with some null fields
        RecurringRule recurringRule = RecurringRule.builder()
                .userId(testUserId)
                .categoryId(savedCategory.getId())
                .type("expense")
                .amount(100.0)
                .description(null) // Test null description
                .frequency("monthly")
                .nextDueDate(null) // Test null nextDueDate (critical crash point!)
                .isActive(true)
                .build();
        mongoTemplate.save(recurringRule);

        // 3. Create a budget with null period
        Budget budget = Budget.builder()
                .userId(testUserId)
                .categoryId(savedCategory.getId())
                .amount(500.0)
                .period(null) // Test null period
                .alertThreshold(0.8)
                .isActive(true)
                .build();
        mongoTemplate.save(budget);

        try {
            // 4. Call list and verify no NullPointerException occurs
            List<Map<String, Object>> result = categoryService.list(testUserId);
            assertNotNull(result);
            assertFalse(result.isEmpty());

            // Find the category we created
            Map<String, Object> enrichedCat = result.stream()
                    .filter(m -> m.get("id").equals(savedCategory.getId()))
                    .findFirst()
                    .orElse(null);

            assertNotNull(enrichedCat);
            assertEquals("Test Category", enrichedCat.get("name"));
            assertNotNull(enrichedCat.get("createdAt"));

            // Check usage map has null for lastTransactionAt without throwing NullPointerException
            Map<String, Object> usage = (Map<String, Object>) enrichedCat.get("usage");
            assertNotNull(usage);
            assertEquals(0, usage.get("transactionCount"));
            assertNull(usage.get("lastTransactionAt"));

            // Check recurring rule is mapped with null fields safely
            List<Map<String, Object>> linkedRules = (List<Map<String, Object>>) enrichedCat.get("linkedRecurringRules");
            assertNotNull(linkedRules);
            assertEquals(1, linkedRules.size());
            Map<String, Object> ruleMap = linkedRules.get(0);
            assertNull(ruleMap.get("description"));
            assertNull(ruleMap.get("nextDueDate"));

            // Check budget is mapped with null period safely
            List<Map<String, Object>> linkedBudgets = (List<Map<String, Object>>) enrichedCat.get("linkedBudgets");
            assertNotNull(linkedBudgets);
            assertEquals(1, linkedBudgets.size());
            Map<String, Object> budgetMap = linkedBudgets.get(0);
            assertNull(budgetMap.get("period"));

        } finally {
            // Clean up test data
            mongoTemplate.remove(new org.springframework.data.mongodb.core.query.Query(
                    org.springframework.data.mongodb.core.query.Criteria.where("userId").is(testUserId)), Category.class);
            mongoTemplate.remove(new org.springframework.data.mongodb.core.query.Query(
                    org.springframework.data.mongodb.core.query.Criteria.where("userId").is(testUserId)), RecurringRule.class);
            mongoTemplate.remove(new org.springframework.data.mongodb.core.query.Query(
                    org.springframework.data.mongodb.core.query.Criteria.where("userId").is(testUserId)), Budget.class);
        }
    }
}

package com.finsight.api.repository;

import com.finsight.common.model.RecurringRule;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RecurringRuleRepository extends MongoRepository<RecurringRule, String> {
    List<RecurringRule> findByUserIdOrderByNextDueDateAsc(String userId);
    Optional<RecurringRule> findByIdAndUserId(String id, String userId);
    List<RecurringRule> findByUserIdAndIsActiveAndNextDueDateBetween(
            String userId, boolean isActive, Instant from, Instant to);
    void deleteAllByUserId(String userId);
}

package com.finsight.api.repository;

import com.finsight.common.model.Budget;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends MongoRepository<Budget, String> {
    List<Budget> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Budget> findByUserIdAndIsActive(String userId, boolean isActive);
    Optional<Budget> findByIdAndUserId(String id, String userId);
}

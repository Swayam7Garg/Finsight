package com.finsight.api.repository;

import com.finsight.common.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends MongoRepository<Transaction, String> {
    Optional<Transaction> findByIdAndUserId(String id, String userId);
    void deleteByIdAndUserId(String id, String userId);
    List<Transaction> findByUserIdOrderByDateDesc(String userId);
    void deleteAllByUserId(String userId);

    Optional<Transaction> findByUserIdAndDateAndAmountAndDescription(
            String userId, Instant date, double amount, String description);

    long countByUserId(String userId);
}

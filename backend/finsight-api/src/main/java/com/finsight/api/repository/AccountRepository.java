package com.finsight.api.repository;

import com.finsight.common.model.Account;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends MongoRepository<Account, String> {
    List<Account> findByUserIdAndIsArchivedOrderByCreatedAtDesc(String userId, boolean isArchived);
    List<Account> findByUserId(String userId);
    Optional<Account> findByIdAndUserId(String id, String userId);
}

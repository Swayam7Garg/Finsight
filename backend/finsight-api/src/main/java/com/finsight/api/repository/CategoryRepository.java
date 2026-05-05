package com.finsight.api.repository;

import com.finsight.common.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, String> {
    @Query("{'$or': [{'userId': null}, {'userId': ?0}]}")
    List<Category> findByUserIdOrDefault(String userId);

    @Query("{'$or': [{'userId': ?0}, {'isDefault': true}]}")
    List<Category> findByUserIdOrIsDefault(String userId);

    Optional<Category> findByIdAndUserId(String id, String userId);
}

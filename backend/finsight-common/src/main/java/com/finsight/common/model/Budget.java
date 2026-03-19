package com.finsight.common.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "budgets")
@CompoundIndex(name = "userId_categoryId", def = "{'userId': 1, 'categoryId': 1}")
public class Budget {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String categoryId;

    private double amount;

    /** One of: monthly, weekly */
    private String period;

    @Builder.Default
    private double alertThreshold = 0.8;

    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

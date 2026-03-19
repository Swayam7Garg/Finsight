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
@Document(collection = "recurringrules")
@CompoundIndex(name = "userId_isActive_nextDueDate", def = "{'userId': 1, 'isActive': 1, 'nextDueDate': 1}")
public class RecurringRule {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String accountId;

    private String categoryId;

    /** One of: income, expense */
    private String type;

    private double amount;

    private String description;

    /** One of: daily, weekly, biweekly, monthly, yearly */
    private String frequency;

    private Instant startDate;

    private Instant nextDueDate;

    private Instant endDate;

    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

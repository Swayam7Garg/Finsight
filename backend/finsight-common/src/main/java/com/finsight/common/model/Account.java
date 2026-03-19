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
@Document(collection = "accounts")
@CompoundIndex(name = "userId_isArchived", def = "{'userId': 1, 'isArchived': 1}")
public class Account {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String name;

    /** One of: checking, savings, credit_card, cash, investment */
    private String type;

    @Builder.Default
    private double balance = 0;

    @Builder.Default
    private String currency = "USD";

    @Builder.Default
    private String color = "#6366f1";

    @Builder.Default
    private boolean isArchived = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

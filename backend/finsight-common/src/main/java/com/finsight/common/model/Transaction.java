package com.finsight.common.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "transactions")
@CompoundIndexes({
    @CompoundIndex(name = "userId_date", def = "{'userId': 1, 'date': -1}"),
    @CompoundIndex(name = "userId_categoryId_date", def = "{'userId': 1, 'categoryId': 1, 'date': -1}"),
    @CompoundIndex(name = "userId_accountId_date", def = "{'userId': 1, 'accountId': 1, 'date': -1}")
})
public class Transaction {

    @Id
    private String id;

    private String userId;

    private String accountId;

    /** One of: income, expense, transfer */
    private String type;

    private double amount;

    @Builder.Default
    private String currency = "USD";

    private String categoryId;

    private String subcategory;

    @TextIndexed
    private String description;

    private String notes;

    private Instant date;

    @Builder.Default
    private boolean isRecurring = false;

    private String recurringRuleId;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

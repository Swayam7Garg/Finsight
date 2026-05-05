package com.finsight.common.dto.transaction;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TransactionResponse {
    private String id;
    private String userId;
    private String accountId;
    private String type;
    private double amount;
    private String currency;
    private String categoryId;
    private String subcategory;
    private String description;
    private String notes;
    private String date;
    private boolean isRecurring;
    private String recurringRuleId;
    private List<String> tags;
    private String createdAt;
    private String updatedAt;
}

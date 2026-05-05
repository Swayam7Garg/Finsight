package com.finsight.common.dto.recurring;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecurringRuleResponse {
    private String id;
    private String userId;
    private String accountId;
    private String categoryId;
    private String type;
    private double amount;
    private String description;
    private String frequency;
    private String startDate;
    private String nextDueDate;
    private String endDate;
    private boolean isActive;
    private String createdAt;
    private String updatedAt;
}

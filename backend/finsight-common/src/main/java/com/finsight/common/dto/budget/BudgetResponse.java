package com.finsight.common.dto.budget;

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
public class BudgetResponse {
    private String id;
    private String userId;
    private String categoryId;
    private double amount;
    private String period;
    private double alertThreshold;
    private boolean isActive;
    private String createdAt;
    private String updatedAt;

    // Extra fields for budget summary
    private Double spent;
    private Double percentage;
    private String status; // under_budget, warning, over_budget
}

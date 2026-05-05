package com.finsight.common.dto.budget;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateBudgetRequest {
    private String categoryId;

    @DecimalMin(value = "0", message = "Budget amount must be positive")
    private Double amount;

    @Pattern(regexp = "^(monthly|weekly)$", message = "Period must be one of: monthly, weekly")
    private String period;

    @DecimalMin(value = "0") @DecimalMax(value = "1")
    private Double alertThreshold;

    private Boolean isActive;
}

package com.finsight.common.dto.budget;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateBudgetRequest {
    @NotBlank(message = "Category ID is required")
    private String categoryId;

    @NotNull(message = "Budget amount is required")
    @DecimalMin(value = "0", message = "Budget amount must be positive")
    private Double amount;

    @NotBlank(message = "Budget period is required")
    @Pattern(regexp = "^(monthly|weekly)$", message = "Period must be one of: monthly, weekly")
    private String period;

    @DecimalMin(value = "0") @DecimalMax(value = "1")
    private Double alertThreshold;

    private Boolean isActive;
}

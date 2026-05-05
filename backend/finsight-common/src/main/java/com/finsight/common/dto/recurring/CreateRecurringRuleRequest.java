package com.finsight.common.dto.recurring;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateRecurringRuleRequest {
    @NotBlank(message = "Account ID is required")
    private String accountId;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "^(income|expense)$", message = "Type must be one of: income, expense")
    private String type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0", message = "Amount must be positive")
    private Double amount;

    @NotBlank(message = "Description is required")
    @Size(max = 200, message = "Description must be at most 200 characters")
    private String description;

    @NotBlank(message = "Frequency is required")
    @Pattern(regexp = "^(daily|weekly|biweekly|monthly|yearly)$",
             message = "Frequency must be one of: daily, weekly, biweekly, monthly, yearly")
    private String frequency;

    @NotBlank(message = "Start date is required")
    private String startDate;

    private String endDate;
}

package com.finsight.common.dto.recurring;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateRecurringRuleRequest {
    private String accountId;
    private String categoryId;

    @Pattern(regexp = "^(income|expense)$", message = "Type must be one of: income, expense")
    private String type;

    @DecimalMin(value = "0", message = "Amount must be positive")
    private Double amount;

    @Size(max = 200, message = "Description must be at most 200 characters")
    private String description;

    @Pattern(regexp = "^(daily|weekly|biweekly|monthly|yearly)$",
             message = "Frequency must be one of: daily, weekly, biweekly, monthly, yearly")
    private String frequency;

    private String startDate;
    private String endDate;

    private Boolean isActive;
}

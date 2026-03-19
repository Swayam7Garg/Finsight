package com.finsight.common.dto.goal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateGoalRequest {
    @Size(min = 1, max = 50, message = "Goal name must be between 1 and 50 characters")
    private String name;

    @DecimalMin(value = "0", message = "Target amount must be positive")
    private Double targetAmount;

    @DecimalMin(value = "0", message = "Current amount cannot be negative")
    private Double currentAmount;

    private String deadline;
    private String color;
    private String icon;

    private Boolean isCompleted;
}

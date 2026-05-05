package com.finsight.common.dto.goal;

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
public class GoalResponse {
    private String id;
    private String userId;
    private String name;
    private double targetAmount;
    private double currentAmount;
    private String deadline;
    private String color;
    private String icon;
    private boolean isCompleted;
    private String createdAt;
    private String updatedAt;
}

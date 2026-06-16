package com.finsight.common.dto.analytics;

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
public class FinancialHealthScoreResponse {
    private int score;
    private String grade;
    private List<FinancialHealthBreakdownItem> breakdown;
    private List<FinancialHealthRecommendation> recommendations;
    private String calculatedAt;
}

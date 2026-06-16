package com.finsight.common.dto.analytics;

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
public class FinancialHealthBreakdownItem {
    private String key;
    private String label;
    private int score;
    private int maxScore;
    private String status;
    private String detail;
}

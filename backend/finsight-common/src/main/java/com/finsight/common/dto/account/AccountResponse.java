package com.finsight.common.dto.account;

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
public class AccountResponse {
    private String id;
    private String userId;
    private String name;
    private String type;
    private double balance;
    private String currency;
    private String color;
    private boolean isArchived;
    private String createdAt;
    private String updatedAt;
}

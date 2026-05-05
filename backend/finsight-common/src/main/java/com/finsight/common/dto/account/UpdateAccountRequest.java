package com.finsight.common.dto.account;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateAccountRequest {
    @Size(min = 1, max = 50, message = "Account name must be between 1 and 50 characters")
    private String name;

    @Pattern(regexp = "^(checking|savings|credit_card|cash|investment)$",
             message = "Type must be one of: checking, savings, credit_card, cash, investment")
    private String type;

    private Double balance;
    private String currency;
    private String color;

    private Boolean isArchived;
}

package com.finsight.common.dto.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateTransactionRequest {
    private String accountId;

    @Pattern(regexp = "^(income|expense|transfer)$", message = "Type must be one of: income, expense, transfer")
    private String type;

    @DecimalMin(value = "0", message = "Amount must be positive")
    private Double amount;

    private String categoryId;
    private String subcategory;

    @Size(max = 200, message = "Description must be at most 200 characters")
    private String description;

    private String notes;
    private String date;
    private Boolean isRecurring;
    private List<String> tags;
}

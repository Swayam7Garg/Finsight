package com.finsight.common.dto.transaction;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class CreateTransactionRequest {
    @NotBlank(message = "Account ID is required")
    private String accountId;

    @NotBlank(message = "Transaction type is required")
    @Pattern(regexp = "^(income|expense|transfer)$", message = "Type must be one of: income, expense, transfer")
    private String type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0", message = "Amount must be positive")
    private Double amount;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    private String subcategory;

    @NotBlank(message = "Description is required")
    @Size(max = 200, message = "Description must be at most 200 characters")
    private String description;

    private String notes;

    @NotBlank(message = "Date is required")
    private String date;

    private Boolean isRecurring;
    private List<String> tags;
}

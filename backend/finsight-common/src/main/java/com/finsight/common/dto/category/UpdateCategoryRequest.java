package com.finsight.common.dto.category;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCategoryRequest {
    @Size(min = 1, max = 30, message = "Category name must be between 1 and 30 characters")
    private String name;

    private String icon;
    private String color;

    @Pattern(regexp = "^(income|expense)$", message = "Type must be one of: income, expense")
    private String type;
}

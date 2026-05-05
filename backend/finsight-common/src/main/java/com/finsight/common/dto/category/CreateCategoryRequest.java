package com.finsight.common.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCategoryRequest {
    @NotBlank(message = "Category name is required")
    @Size(min = 1, max = 30, message = "Category name must be between 1 and 30 characters")
    private String name;

    @NotBlank(message = "Icon is required")
    private String icon;

    @NotBlank(message = "Color is required")
    private String color;

    @NotBlank(message = "Category type is required")
    @Pattern(regexp = "^(income|expense)$", message = "Type must be one of: income, expense")
    private String type;
}

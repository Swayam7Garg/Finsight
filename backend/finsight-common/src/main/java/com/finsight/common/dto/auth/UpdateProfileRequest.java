package com.finsight.common.dto.auth;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @Size(min = 3, max = 3, message = "Currency must be exactly 3 characters")
    private String currency;
}

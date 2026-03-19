package com.finsight.api.controller;

import com.finsight.api.service.RecurringService;
import com.finsight.common.dto.ApiResponse;
import com.finsight.common.dto.recurring.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/recurring")
@RequiredArgsConstructor
@Tag(name = "Recurring Rules", description = "Recurring transaction rule management")
public class RecurringController {

    private final RecurringService recurringService;

    @GetMapping
    @Operation(summary = "List all recurring rules")
    public ResponseEntity<ApiResponse<List<RecurringRuleResponse>>> list(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(recurringService.list(auth.getName())));
    }

    @PostMapping
    @Operation(summary = "Create a new recurring rule")
    public ResponseEntity<ApiResponse<RecurringRuleResponse>> create(
            Authentication auth, @Valid @RequestBody CreateRecurringRuleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                recurringService.create(auth.getName(), req.getAccountId(), req.getCategoryId(),
                        req.getType(), req.getAmount(), req.getDescription(),
                        req.getFrequency(), req.getStartDate(), req.getEndDate())));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a recurring rule")
    public ResponseEntity<ApiResponse<RecurringRuleResponse>> update(
            Authentication auth, @PathVariable String id,
            @Valid @RequestBody UpdateRecurringRuleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(recurringService.update(
                auth.getName(), id, req.getAccountId(), req.getCategoryId(),
                req.getType(), req.getAmount(), req.getDescription(),
                req.getFrequency(), req.getStartDate(), req.getEndDate(), req.getIsActive())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a recurring rule")
    public ResponseEntity<ApiResponse<RecurringRuleResponse>> delete(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(recurringService.delete(auth.getName(), id)));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming recurring rules (next 30 days)")
    public ResponseEntity<ApiResponse<List<RecurringRuleResponse>>> upcoming(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(recurringService.getUpcoming(auth.getName())));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Mark a recurring rule as paid for current cycle")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAsPaid(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(recurringService.markAsPaid(auth.getName(), id)));
    }
}

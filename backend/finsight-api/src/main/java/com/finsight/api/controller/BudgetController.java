package com.finsight.api.controller;

import com.finsight.api.service.BudgetService;
import com.finsight.common.dto.ApiResponse;
import com.finsight.common.dto.budget.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Budget management")
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    @Operation(summary = "List all budgets")
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> list(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(budgetService.list(auth.getName())));
    }

    @PostMapping
    @Operation(summary = "Create a new budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> create(
            Authentication auth, @Valid @RequestBody CreateBudgetRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                budgetService.create(auth.getName(), req.getCategoryId(), req.getAmount(),
                        req.getPeriod(), req.getAlertThreshold(), req.getIsActive())));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(
            Authentication auth, @PathVariable String id, @Valid @RequestBody UpdateBudgetRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(budgetService.update(
                auth.getName(), id, req.getCategoryId(), req.getAmount(),
                req.getPeriod(), req.getAlertThreshold(), req.getIsActive())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> delete(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(budgetService.delete(auth.getName(), id)));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get active budget summary with spending")
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> summary(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(budgetService.getSummary(auth.getName())));
    }
}

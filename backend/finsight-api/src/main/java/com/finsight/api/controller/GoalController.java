package com.finsight.api.controller;

import com.finsight.api.service.GoalService;
import com.finsight.common.dto.ApiResponse;
import com.finsight.common.dto.goal.*;
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
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
@Tag(name = "Goals", description = "Financial goal tracking")
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    @Operation(summary = "List all goals")
    public ResponseEntity<ApiResponse<List<GoalResponse>>> list(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(goalService.list(auth.getName())));
    }

    @PostMapping
    @Operation(summary = "Create a new goal")
    public ResponseEntity<ApiResponse<GoalResponse>> create(
            Authentication auth, @Valid @RequestBody CreateGoalRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                goalService.create(auth.getName(), req.getName(), req.getTargetAmount(),
                        req.getCurrentAmount(), req.getDeadline(), req.getColor(), req.getIcon())));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a goal")
    public ResponseEntity<ApiResponse<GoalResponse>> update(
            Authentication auth, @PathVariable String id, @Valid @RequestBody UpdateGoalRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(goalService.update(
                auth.getName(), id, req.getName(), req.getTargetAmount(),
                req.getCurrentAmount(), req.getDeadline(), req.getColor(), req.getIcon(),
                req.getIsCompleted())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a goal")
    public ResponseEntity<ApiResponse<GoalResponse>> delete(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(goalService.delete(auth.getName(), id)));
    }

    @PostMapping("/{id}/add-funds")
    @Operation(summary = "Add funds to a goal")
    public ResponseEntity<ApiResponse<GoalResponse>> addFunds(
            Authentication auth, @PathVariable String id, @RequestBody Map<String, Double> body) {
        return ResponseEntity.ok(ApiResponse.ok(goalService.addFunds(auth.getName(), id, body.get("amount"))));
    }
}

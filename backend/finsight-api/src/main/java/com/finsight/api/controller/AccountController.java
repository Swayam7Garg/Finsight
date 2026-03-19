package com.finsight.api.controller;

import com.finsight.api.service.AccountService;
import com.finsight.common.dto.ApiResponse;
import com.finsight.common.dto.account.*;
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
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts", description = "Financial account management")
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    @Operation(summary = "List all active accounts")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> list(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.list(auth.getName())));
    }

    @PostMapping
    @Operation(summary = "Create a new account")
    public ResponseEntity<ApiResponse<AccountResponse>> create(
            Authentication auth, @Valid @RequestBody CreateAccountRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                accountService.create(auth.getName(), req.getName(), req.getType(),
                        req.getBalance(), req.getCurrency(), req.getColor())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account by ID")
    public ResponseEntity<ApiResponse<AccountResponse>> getById(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.getById(auth.getName(), id)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update an account")
    public ResponseEntity<ApiResponse<AccountResponse>> update(
            Authentication auth, @PathVariable String id, @Valid @RequestBody UpdateAccountRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.update(
                auth.getName(), id, req.getName(), req.getType(),
                req.getBalance(), req.getCurrency(), req.getColor(), req.getIsArchived())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Archive an account (soft delete)")
    public ResponseEntity<ApiResponse<AccountResponse>> archive(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.archive(auth.getName(), id)));
    }

    @GetMapping("/{id}/balance-history")
    @Operation(summary = "Get account balance history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> balanceHistory(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.getBalanceHistory(auth.getName(), id)));
    }
}

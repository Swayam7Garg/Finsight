package com.finsight.api.controller;

import com.finsight.api.service.TransactionService;
import com.finsight.common.dto.ApiResponse;
import com.finsight.common.dto.PaginatedResponse;
import com.finsight.common.dto.transaction.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Transaction management")
public class TransactionController {

    private final TransactionService transactionService;
    private final com.finsight.api.service.CsvImportService csvImportService;

    @GetMapping
    @Operation(summary = "List transactions with filters, sorting, and pagination")
    public ResponseEntity<ApiResponse<PaginatedResponse<TransactionResponse>>> list(
            Authentication auth, @RequestParam Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.list(auth.getName(), filters)));
    }

    @PostMapping
    @Operation(summary = "Create a new transaction")
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
            Authentication auth, @Valid @RequestBody CreateTransactionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                transactionService.create(auth.getName(), req.getAccountId(), req.getType(),
                        req.getAmount(), req.getCategoryId(), req.getSubcategory(),
                        req.getDescription(), req.getNotes(), req.getDate(),
                        req.getIsRecurring(), req.getTags())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID")
    public ResponseEntity<ApiResponse<TransactionResponse>> getById(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getById(auth.getName(), id)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a transaction")
    public ResponseEntity<ApiResponse<TransactionResponse>> update(
            Authentication auth, @PathVariable String id,
            @Valid @RequestBody UpdateTransactionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.update(
                auth.getName(), id, req.getAccountId(), req.getType(),
                req.getAmount(), req.getCategoryId(), req.getSubcategory(),
                req.getDescription(), req.getNotes(), req.getDate(),
                req.getIsRecurring(), req.getTags())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a transaction")
    public ResponseEntity<ApiResponse<TransactionResponse>> delete(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.delete(auth.getName(), id)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search transactions by description")
    public ResponseEntity<ApiResponse<PaginatedResponse<TransactionResponse>>> search(
            Authentication auth,
            @RequestParam String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.search(auth.getName(), q, page, limit)));
    }

    @PostMapping(value = "/import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import CSV")
    public ResponseEntity<ApiResponse<com.finsight.common.dto.ImportResult>> importCsv(
            Authentication auth,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("accountId") String accountId,
            @RequestParam("defaultCategoryId") String defaultCategoryId,
            @RequestParam(value = "mapping", required = false) String mappingRaw) throws java.io.IOException {

        if (file == null || file.isEmpty()) {
            throw com.finsight.common.exception.ApiException.badRequest("A CSV file is required");
        }

        Map<String, String> mapping = new java.util.HashMap<>();
        if (mappingRaw != null && !mappingRaw.isBlank()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                mapping = mapper.readValue(mappingRaw, new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});
            } catch (Exception e) {
                throw com.finsight.common.exception.ApiException.badRequest("mapping must be valid JSON");
            }
        }

        String csvContent = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok(ApiResponse.ok(csvImportService.importCsv(
                auth.getName(), csvContent, mapping, accountId, defaultCategoryId)));
    }
}

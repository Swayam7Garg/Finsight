package com.finsight.api.controller;

import com.finsight.api.service.CategoryService;
import com.finsight.common.dto.ApiResponse;
import com.finsight.common.dto.category.*;
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
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Transaction category management")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List all categories (including system defaults)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.list(auth.getName())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID with usage info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getById(auth.getName(), id)));
    }

    @PostMapping
    @Operation(summary = "Create a new category")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            Authentication auth, @Valid @RequestBody CreateCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                categoryService.create(auth.getName(), req.getName(),
                        req.getIcon(), req.getColor(), req.getType())));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a category")
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(
            Authentication auth, @PathVariable String id,
            @Valid @RequestBody UpdateCategoryRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.update(
                auth.getName(), id, req.getName(), req.getIcon(), req.getColor(), req.getType())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a category (if not in use)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> delete(
            Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.remove(auth.getName(), id)));
    }
}

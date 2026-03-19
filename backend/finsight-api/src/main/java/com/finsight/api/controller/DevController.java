package com.finsight.api.controller;

import com.finsight.api.service.DevService;
import com.finsight.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Development-only utilities for seeding and resetting data.
 * In a real production environment, this should be disabled via @Profile("dev").
 */
@RestController
@RequestMapping("/api/v1/dev")
@RequiredArgsConstructor
@Tag(name = "Development", description = "Development only utilities")
public class DevController {

    private final DevService devService;

    @PostMapping("/seed")
    @Operation(summary = "Seed development data (categories only)")
    public ResponseEntity<ApiResponse<Map<String, String>>> seed() {
        devService.seedCategories();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Database seeded successfully")));
    }
}

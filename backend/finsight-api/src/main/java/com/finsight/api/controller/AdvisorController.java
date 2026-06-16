package com.finsight.api.controller;

import com.finsight.api.service.AdvisorService;
import com.finsight.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Advisor Controller — AI financial advisor powered by Google Gemini.
 * Requires GOOGLE_AI_API_KEY to be set as an environment variable.
 */
@RestController
@RequestMapping("/api/v1/advisor")
@RequiredArgsConstructor
@Tag(name = "AI Advisor", description = "AI-powered financial advisor (Google Gemini)")
public class AdvisorController {

    private final AdvisorService advisorService;

    @PostMapping("/chat")
    @Operation(summary = "Chat with AI financial advisor")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(
            Authentication auth,
            @RequestBody Map<String, Object> body) {

        String userId = auth.getName();
        String message = (String) body.get("message");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> history = (List<Map<String, String>>) body.get("conversationHistory");

        Map<String, Object> result = advisorService.chat(userId, message, history);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/status")
    @Operation(summary = "Check advisor AI availability")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        boolean available = advisorService.isConfigured();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "available", available,
                "reason", available ? "Gemini API is configured and ready" : "GOOGLE_AI_API_KEY not configured"
        )));
    }
}

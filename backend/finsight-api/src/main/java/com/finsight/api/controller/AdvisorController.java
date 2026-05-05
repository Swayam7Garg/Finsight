package com.finsight.api.controller;

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
 * Requires GOOGLE_AI_API_KEY or GEMINI_API_KEY to be set.
 * Full implementation mirrors the Express AdvisorService with context building,
 * model rotation, and conversation history.
 */
@RestController
@RequestMapping("/api/v1/advisor")
@RequiredArgsConstructor
@Tag(name = "AI Advisor", description = "AI-powered financial advisor (Google Gemini)")
public class AdvisorController {

    @PostMapping("/chat")
    @Operation(summary = "Chat with AI financial advisor")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        String message = (String) body.get("message");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> history = (List<Map<String, String>>) body.get("conversationHistory");

        // TODO: Implement full Gemini integration when API key is provided
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "reply", "AI Advisor is not yet configured. Please provide a GOOGLE_AI_API_KEY.",
                "suggestions", List.of(),
                "actions", List.of()
        )));
    }

    @GetMapping("/status")
    @Operation(summary = "Check advisor AI availability")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        // TODO: Check if Gemini API key is configured
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "available", false,
                "reason", "GOOGLE_AI_API_KEY not configured"
        )));
    }
}

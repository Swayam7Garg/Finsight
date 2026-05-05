package com.finsight.api.controller;

import com.finsight.api.service.AuthService;
import com.finsight.common.dto.ApiResponse;
import com.finsight.common.dto.auth.*;
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
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and profile management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(authService.register(req.getEmail(), req.getName(), req.getPassword())));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(req.getEmail(), req.getPassword())));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<Object>> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refreshToken(req.getRefreshToken())));
    }

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<AuthResponse.UserProfile>> profile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getProfile(auth.getName())));
    }

    @PatchMapping("/profile")
    @Operation(summary = "Update user profile")
    public ResponseEntity<ApiResponse<AuthResponse.UserProfile>> updateProfile(
            Authentication auth, @Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                authService.updateProfile(auth.getName(), req.getName(), req.getCurrency())));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Verify if email exists (for password reset)")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(@RequestBody Map<String, String> body) {
        authService.verifyEmailExists(body.get("email"));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "If an account exists with this email, you can proceed to reset")));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.getEmail(), req.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Password has been reset successfully")));
    }

    @DeleteMapping("/account")
    @Operation(summary = "Delete user account and all data")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteAccount(Authentication auth) {
        authService.deleteAccount(auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Account deleted successfully")));
    }
}

package com.finsight.api.service;

import com.finsight.api.repository.*;
import com.finsight.api.security.JwtTokenProvider;
import com.finsight.common.dto.auth.AuthResponse;
import com.finsight.common.exception.ApiException;
import com.finsight.common.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final RecurringRuleRepository recurringRuleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse register(String email, String name, String password) {
        if (userRepository.existsByEmail(email.toLowerCase())) {
            throw ApiException.conflict("A user with this email already exists");
        }

        User user = User.builder()
                .email(email.toLowerCase())
                .name(name)
                .passwordHash(passwordEncoder.encode(password))
                .build();
        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }

        return buildAuthResponse(user);
    }

    public AuthResponse.UserProfile getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        return toUserProfile(user);
    }

    public AuthResponse.UserProfile updateProfile(String userId, String name, String currency) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (name != null) user.setName(name);
        if (currency != null) user.setCurrency(currency);
        user = userRepository.save(user);

        return toUserProfile(user);
    }

    public Object refreshToken(String token) {
        String userId = jwtTokenProvider.validateRefreshToken(token);
        return java.util.Map.of(
                "accessToken", jwtTokenProvider.generateAccessToken(userId),
                "refreshToken", jwtTokenProvider.generateRefreshToken(userId)
        );
    }

    public void verifyEmailExists(String email) {
        userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> ApiException.notFound("No account found with this email address"));
    }

    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> ApiException.notFound("No account found with this email address"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void deleteAccount(String userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        transactionRepository.deleteAllByUserId(userId);
        accountRepository.deleteAll(accountRepository.findByUserId(userId));
        budgetRepository.deleteAll(budgetRepository.findByUserIdOrderByCreatedAtDesc(userId));
        goalRepository.deleteAll(goalRepository.findByUserIdOrderByCreatedAtDesc(userId));
        recurringRuleRepository.deleteAllByUserId(userId);
        userRepository.deleteById(userId);
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .user(toUserProfile(user))
                .accessToken(jwtTokenProvider.generateAccessToken(user.getId()))
                .refreshToken(jwtTokenProvider.generateRefreshToken(user.getId()))
                .build();
    }

    private AuthResponse.UserProfile toUserProfile(User user) {
        return AuthResponse.UserProfile.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .currency(user.getCurrency())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}

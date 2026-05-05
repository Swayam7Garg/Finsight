package com.finsight.api.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey accessKey;
    private final SecretKey refreshKey;
    private final Duration accessTokenExpiry;
    private final Duration refreshTokenExpiry;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.refresh-secret}") String refreshSecret,
            @Value("${app.jwt.access-token-expiry}") String accessExpiry,
            @Value("${app.jwt.refresh-token-expiry}") String refreshExpiry) {
        this.accessKey = Keys.hmacShaKeyFor(padKey(secret));
        this.refreshKey = Keys.hmacShaKeyFor(padKey(refreshSecret));
        this.accessTokenExpiry = parseDuration(accessExpiry);
        this.refreshTokenExpiry = parseDuration(refreshExpiry);
    }

    public String generateAccessToken(String userId) {
        return buildToken(userId, accessKey, accessTokenExpiry);
    }

    public String generateRefreshToken(String userId) {
        return buildToken(userId, refreshKey, refreshTokenExpiry);
    }

    public String validateAccessToken(String token) {
        return parseToken(token, accessKey);
    }

    public String validateRefreshToken(String token) {
        return parseToken(token, refreshKey);
    }

    private String buildToken(String userId, SecretKey key, Duration expiry) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiry.toMillis());

        return Jwts.builder()
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    private String parseToken(String token, SecretKey key) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get("userId", String.class);
    }

    private Duration parseDuration(String value) {
        value = value.trim().toLowerCase();
        if (value.endsWith("m")) {
            return Duration.ofMinutes(Long.parseLong(value.replace("m", "")));
        } else if (value.endsWith("h")) {
            return Duration.ofHours(Long.parseLong(value.replace("h", "")));
        } else if (value.endsWith("d")) {
            return Duration.ofDays(Long.parseLong(value.replace("d", "")));
        }
        return Duration.ofMinutes(15); // default
    }

    private byte[] padKey(String key) {
        byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length >= 32) {
            return keyBytes;
        }
        // Pad to 32 bytes for HMAC-SHA256
        byte[] padded = new byte[32];
        System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
        return padded;
    }
}

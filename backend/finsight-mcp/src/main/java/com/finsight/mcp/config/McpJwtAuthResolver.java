package com.finsight.mcp.config;

import com.finsight.common.exception.ApiException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class McpJwtAuthResolver {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Resolves the user ID from a JWT token.
     * Throws an exception if the token is invalid or missing.
     */
    public String resolveUserId(String token) {
        if (!StringUtils.hasText(token)) {
            throw ApiException.unauthorized("Authentication required");
        }

        try {
            String actualToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(actualToken)
                    .getPayload();

            return claims.getSubject();
        } catch (Exception ex) {
            throw ApiException.unauthorized("Invalid or expired token");
        }
    }
}

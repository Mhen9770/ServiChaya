package com.servichaya.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    public String generateToken(Long userId, String email, String role) {
        log.debug("Generating JWT token for userId: {}, email: {}, role: {}", userId, email, role);
        try {
            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", userId);
            claims.put("email", email);
            claims.put("role", role);
            String token = createToken(claims, userId.toString());
            log.debug("JWT token generated successfully for userId: {}", userId);
            return token;
        } catch (Exception e) {
            log.error("Error generating JWT token for userId: {}", userId, e);
            throw e;
        }
    }

    public String generateRefreshToken(Long userId) {
        log.debug("Generating refresh token for userId: {}", userId);
        try {
            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", userId);
            String refreshToken = createToken(claims, userId.toString() + "_refresh");
            log.debug("Refresh token generated successfully for userId: {}", userId);
            return refreshToken;
        } catch (Exception e) {
            log.error("Error generating refresh token for userId: {}", userId, e);
            throw e;
        }
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
            .claims(claims)
            .subject(subject)
            .issuedAt(new Date(System.currentTimeMillis()))
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey())
            .compact();
    }

    public Boolean validateToken(String token) {
        log.debug("Validating JWT token");
        try {
            boolean isValid = !isTokenExpired(token);
            log.debug("Token validation result: {}", isValid);
            return isValid;
        } catch (Exception e) {
            log.warn("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public String extractUsername(String token) {
        log.debug("Extracting username from token");
        try {
            String username = extractClaim(token, Claims::getSubject);
            log.debug("Username extracted: {}", username);
            return username;
        } catch (Exception e) {
            log.error("Error extracting username from token", e);
            throw e;
        }
    }

    public Long extractUserId(String token) {
        log.debug("Extracting userId from token");
        try {
            Claims claims = extractAllClaims(token);
            Long userId = claims.get("userId", Long.class);
            log.debug("UserId extracted: {}", userId);
            return userId;
        } catch (Exception e) {
            log.error("Error extracting userId from token", e);
            throw e;
        }
    }

    public String extractRole(String token) {
        log.debug("Extracting role from token");
        try {
            Claims claims = extractAllClaims(token);
            String role = claims.get("role", String.class);
            log.debug("Role extracted: {}", role);
            return role;
        } catch (Exception e) {
            log.error("Error extracting role from token", e);
            throw e;
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

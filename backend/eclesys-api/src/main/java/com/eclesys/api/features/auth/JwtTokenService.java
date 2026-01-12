package com.eclesys.api.features.auth;

import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.user.UserEntity;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtTokenService {

  private final String jwtSecret;
  private final long jwtExpirationMinutes;

  public JwtTokenService(
      @Value("${eclesys.jwt.secret}") String jwtSecret,
      @Value("${eclesys.jwt.expiration-minutes}") long jwtExpirationMinutes
  ) {
    this.jwtSecret = jwtSecret;
    this.jwtExpirationMinutes = jwtExpirationMinutes;
  }

  public String generateToken(UserEntity user, TenantEntity tenant) {
    Instant now = Instant.now();
    Instant expiresAt = now.plusSeconds(jwtExpirationMinutes * 60);

    Map<String, Object> claims = Map.of(
        "tenantId", tenant.getId().toString(),
        "tenantCode", tenant.getTenantCode(),
        "role", user.getRole().name()
    );

    return Jwts.builder()
        .setSubject(user.getId().toString())
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(expiresAt))
        .addClaims(claims)
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  public boolean isTokenValid(String token) {
    try {
      parseClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException ex) {
      return false;
    }
  }

  public Claims parseClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .getBody();
  }

  public String getUserIdFromToken(String token) {
    return parseClaims(token).getSubject();
  }

  public String getTenantCodeFromToken(String token) {
    Object value = parseClaims(token).get("tenantCode");
    return value == null ? null : value.toString();
  }

  private Key getSigningKey() {
    // Para HS256, o segredo precisa ser suficientemente longo
    byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
    return Keys.hmacShaKeyFor(secretBytes);
  }
}

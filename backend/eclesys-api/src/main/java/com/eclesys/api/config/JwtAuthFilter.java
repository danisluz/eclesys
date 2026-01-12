package com.eclesys.api.config;

import com.eclesys.api.features.auth.JwtTokenService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private JwtTokenService jwtTokenService;

  public JwtAuthFilter(JwtTokenService jwtTokenService) {
    this.jwtTokenService = jwtTokenService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {

    String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = authHeader.substring("Bearer ".length()).trim();

    try {
      Claims claims = jwtTokenService.parseClaims(token);

      String userId = claims.getSubject();
      String role = String.valueOf(claims.get("role"));

      Map<String, Object> principal = Map.of(
          "userId", userId,
          "tenantId", String.valueOf(claims.get("tenantId")),
          "tenantCode", String.valueOf(claims.get("tenantCode")),
          "role", role,
          "issuedAt", claims.getIssuedAt(),
          "expiresAt", claims.getExpiration()
      );

      UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(
              principal,
              null,
              List.of(new SimpleGrantedAuthority("ROLE_" + role))
          );

      SecurityContextHolder.getContext().setAuthentication(authentication);

      filterChain.doFilter(request, response);

    } catch (Exception ex) {
      SecurityContextHolder.clearContext();

      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      response.getWriter().write("""
        {"status":"error","message":"Token inválido ou expirado."}
      """);
    }
  }
}

package com.eclesys.api.features.auth;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitLoginFilter extends OncePerRequestFilter {

  private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !(request.getRequestURI().equals("/api/auth/login")
        && request.getMethod().equalsIgnoreCase("POST"));
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {

    String ip = resolveClientIp(request);

    Bucket bucket = buckets.computeIfAbsent(ip, key -> newBucket());

    if (!bucket.tryConsume(1)) {
      response.setStatus(429);
      response.getWriter().write("{\"status\":\"error\",\"message\":\"Muitas tentativas de login. Aguarde.\"}");
      return;
    }

    filterChain.doFilter(request, response);
  }

  private Bucket newBucket() {
    return Bucket.builder()
        .addLimit(Bandwidth.simple(5, Duration.ofMinutes(1)))
        .build();
  }

  private String resolveClientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    return forwarded != null ? forwarded.split(",")[0] : request.getRemoteAddr();
  }
}

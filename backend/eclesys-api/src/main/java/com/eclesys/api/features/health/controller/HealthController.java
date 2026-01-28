package com.eclesys.api.features.health.controller;

import com.eclesys.api.shared.api.ApiResponse;
import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/api/health")
  public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
    return ResponseEntity.ok(ApiResponse.success(Map.of(
        "status", "UP",
        "timestamp", OffsetDateTime.now().toString()
    )));
  }

  @GetMapping("/api/ping")
  public ResponseEntity<ApiResponse<Map<String, Object>>> ping() {
    return ResponseEntity.ok(ApiResponse.success(Map.of(
        "message", "pong",
        "serverTime", OffsetDateTime.now().toString()
    )));
  }

  @GetMapping("/api/version")
  public ResponseEntity<ApiResponse<Map<String, Object>>> version() {
    return ResponseEntity.ok(ApiResponse.success(Map.of(
        "application", "eclesys-api",
        "version", "0.1.0",
        "commit", "local"
    )));
  }
}

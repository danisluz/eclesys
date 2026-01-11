package com.eclesys.api.modules.health.controller;

import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SystemController {

  @GetMapping("/api/health")
  public Map<String, Object> health() {
    return Map.of(
        "status", "UP",
        "timestamp", OffsetDateTime.now().toString()
    );
  }

  @GetMapping("/api/ping")
  public Map<String, Object> ping() {
    return Map.of(
        "message", "pong",
        "serverTime", OffsetDateTime.now().toString()
    );
  }

  @GetMapping("/api/version")
  public Map<String, Object> version() {
    return Map.of(
        "application", "eclesys-api",
        "version", "0.1.0",
        "commit", "local"
    );
  }
}

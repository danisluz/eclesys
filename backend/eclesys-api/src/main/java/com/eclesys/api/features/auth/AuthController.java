package com.eclesys.api.features.auth;

import com.eclesys.api.features.auth.dto.LoginRequest;
import com.eclesys.api.features.auth.dto.LoginResponse;
import com.eclesys.api.shared.api.ApiResponse;
import com.eclesys.api.shared.api.security.TurnstileValidationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final TurnstileValidationService turnstileValidationService;

  public AuthController(AuthService authService, TurnstileValidationService turnstileValidationService) {
    this.authService = authService;
    this.turnstileValidationService = turnstileValidationService;
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<LoginResponse>> login(
      @RequestHeader(name = "X-Tenant-Code") String tenantCode,
      @Valid @RequestBody LoginRequest request
  ) {
    if (!turnstileValidationService.isValid(request.antiBotToken)) {
      return ResponseEntity.badRequest().body(ApiResponse.error("Validação anti-bot falhou"));
    }

    LoginResponse response = authService.login(tenantCode, request);
    return ResponseEntity.ok(ApiResponse.success(response));
  }
}

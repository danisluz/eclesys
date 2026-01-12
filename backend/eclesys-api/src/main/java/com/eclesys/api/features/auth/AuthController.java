package com.eclesys.api.features.auth;

import com.eclesys.api.features.auth.dto.LoginRequest;
import com.eclesys.api.features.auth.dto.LoginResponse;
import com.eclesys.api.shared.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<LoginResponse>> login(
      @RequestHeader(name = "X-Tenant-Code") String tenantCode,
      @Valid @RequestBody LoginRequest request
  ) {
    LoginResponse response = authService.login(tenantCode, request);
    return ResponseEntity.ok(ApiResponse.success(response));
  }
}

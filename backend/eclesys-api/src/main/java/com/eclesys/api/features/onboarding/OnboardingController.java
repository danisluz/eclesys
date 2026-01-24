package com.eclesys.api.features.onboarding;

import com.eclesys.api.features.onboarding.dto.OnboardingRequest;
import com.eclesys.api.features.onboarding.dto.OnboardingResponse;
import com.eclesys.api.shared.api.ApiResponse;
import com.eclesys.api.shared.api.security.TurnstileValidationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/onboarding")
public class OnboardingController {

  private final OnboardingService onboardingService;
  private final TurnstileValidationService turnstileValidationService;

  public OnboardingController(
      OnboardingService onboardingService,
      TurnstileValidationService turnstileValidationService
  ) {
    this.onboardingService = onboardingService;
    this.turnstileValidationService = turnstileValidationService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<OnboardingResponse>> create(
      @Valid @RequestBody OnboardingRequest request
  ) {
    System.out.println("=== ONBOARDING REQUEST ===");
    System.out.println("Tenant Code: " + request.tenantCode);
    System.out.println("Church Name: " + request.churchName);
    System.out.println("Admin Email: " + request.adminEmail);
    System.out.println("Anti-bot token: " + (request.antiBotToken != null && !request.antiBotToken.isBlank() ? "EXISTS (length: " + request.antiBotToken.length() + ")" : "NULL/EMPTY"));
    
    if (!turnstileValidationService.isValid(request.antiBotToken)) {
      System.out.println("❌ Turnstile validation FAILED");
      return ResponseEntity.badRequest().body(ApiResponse.error("Validação anti-bot falhou"));
    }

    System.out.println("✅ Turnstile validation PASSED");
    OnboardingResponse response = onboardingService.createTenantWithAdmin(request);
    return ResponseEntity.ok(ApiResponse.success(response));
  }
}

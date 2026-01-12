package com.eclesys.api.features.onboarding;

import com.eclesys.api.features.onboarding.dto.OnboardingRequest;
import com.eclesys.api.features.onboarding.dto.OnboardingResponse;
import com.eclesys.api.shared.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/onboarding")
public class OnboardingController {

  private OnboardingService onboardingService;

  public OnboardingController(OnboardingService onboardingService) {
    this.onboardingService = onboardingService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<OnboardingResponse>> create(@Valid @RequestBody OnboardingRequest request) {
    OnboardingResponse response = onboardingService.createTenantWithAdmin(request);
    return ResponseEntity.ok(ApiResponse.success(response));
  }
}

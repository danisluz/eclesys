package com.eclesys.api.features.onboarding.dto;

import java.util.UUID;

public class OnboardingResponse {
  public UUID tenantId;
  public String tenantCode;
  public UUID adminUserId;

  public OnboardingResponse(UUID tenantId, String tenantCode, UUID adminUserId) {
    this.tenantId = tenantId;
    this.tenantCode = tenantCode;
    this.adminUserId = adminUserId;
  }
}

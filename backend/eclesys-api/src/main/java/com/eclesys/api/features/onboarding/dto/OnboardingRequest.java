package com.eclesys.api.features.onboarding.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class OnboardingRequest {

  @NotBlank
  @Size(min = 3, max = 120)
  public String churchName;

  @NotBlank
  @Size(min = 3, max = 60)
  public String tenantCode;

  public String logoUrl;

  @NotBlank
  @Size(min = 3, max = 120)
  public String adminName;

  @NotBlank
  @Email
  @Size(max = 180)
  public String adminEmail;

  @NotBlank
  @Size(min = 6, max = 80)
  public String adminPassword;
}

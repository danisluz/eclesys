package com.eclesys.api.features.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

  private String email;
  private String password;

  public String getEmail() {
    return email;
  }

  public String getPassword() {
    return password;
  }

  @NotBlank
  public String antiBotToken;
}

package com.eclesys.api.features.auth.dto;

public class LoginResponse {
  public String token;

  public LoginResponse() {
  }

  public LoginResponse(String token) {
    this.token = token;
  }
}

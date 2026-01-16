package com.eclesys.api.shared.api.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class TurnstileValidationService {

  private static final Logger logger =
      LoggerFactory.getLogger(TurnstileValidationService.class);

  private final RestClient restClient;
  private final String secret;

  public TurnstileValidationService(
      @Value("${security.turnstile.secret}") String secret
  ) {
    this.secret = secret;
    this.restClient = RestClient.create();

    logger.info("Turnstile secret carregada? {}", secret != null && !secret.isBlank());
  }

  @SuppressWarnings("unchecked")
  public boolean isValid(String token) {

    if (token == null || token.isBlank()) {
      logger.warn("Turnstile token vazio");
      return false;
    }

    if (secret == null || secret.isBlank()) {
      logger.error("TURNSTILE_SECRET não configurada");
      return false;
    }

    try {
      MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
      form.add("secret", secret);
      form.add("response", token);

      Map<String, Object> response = this.restClient.post()
          .uri("https://challenges.cloudflare.com/turnstile/v0/siteverify")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(form)
          .retrieve()
          .body(Map.class);

      Object success = response.get("success");
      boolean valid = success instanceof Boolean && (Boolean) success;

      if (!valid) {
        logger.warn("Turnstile falhou: {}", response);
      }

      return valid;

    } catch (Exception ex) {
      logger.error("Erro ao validar Turnstile", ex);
      return false;
    }
  }
}

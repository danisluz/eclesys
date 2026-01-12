package com.eclesys.api.shared.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiResponse<Object>> handleRuntime(RuntimeException exception) {
    String message = mapMessage(exception.getMessage());
    return ResponseEntity.badRequest().body(ApiResponse.error(message));
  }

  private String mapMessage(String code) {
    if (code == null) return "Erro inesperado";
    return switch (code) {
      case "tenant_code_already_exists" -> "Já existe uma igreja com esse código.";
      case "invalid_credentials" -> "Credenciais inválidas.";
      case "tenant_inactive" -> "Igreja inativa. Verifique a assinatura ou suporte.";
      case "user_inactive" -> "Usuário inativo. Verifique com o administrador.";
      default -> "Erro inesperado";
    };
  }
}

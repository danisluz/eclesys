package com.eclesys.api.shared.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException exception) {
    // regra de negócio -> mensagem real
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(safeMessage(exception.getMessage())));
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ApiResponse<Object>> handleIllegalState(IllegalStateException exception) {
    // regra de negócio -> mensagem real
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(safeMessage(exception.getMessage())));
  }

  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ApiResponse<Object>> handleForbidden(ForbiddenException exception) {
    String message = mapMessage(exception.getMessage());

    if (!"Erro inesperado".equals(message)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(message));
    }

    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiResponse.error(safeMessage(exception.getMessage())));
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiResponse<Object>> handleRuntime(RuntimeException exception) {
    // mantém compatibilidade: se for "código conhecido", traduz
    String message = mapMessage(exception.getMessage());

    // se não for um código conhecido, NÃO mascara como "Erro inesperado":
    // devolve a mensagem real (pra debug e pra regra de negócio que usa RuntimeException)
    if (!"Erro inesperado".equals(message)) {
      return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    String original = exception.getMessage();
    if (original != null && !original.isBlank()) {
      return ResponseEntity.badRequest().body(ApiResponse.error(original));
    }

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error("Erro inesperado"));
  }

  private String safeMessage(String message) {
    if (message == null || message.isBlank()) return "Erro inesperado";
    return message;
  }

  private String mapMessage(String code) {
    if (code == null) return "Erro inesperado";
    return switch (code) {
      case "tenant_code_already_exists" -> "Já existe uma igreja com esse código.";
      case "invalid_credentials" -> "Credenciais inválidas.";
      case "tenant_inactive" -> "Igreja inativa. Verifique a assinatura ou suporte.";
      case "user_inactive" -> "Usuário inativo. Verifique com o administrador.";
      case "cannot_change_admin" -> "Não é permitido alterar usuários ADMIN.";
      case "forbidden" -> "Acesso negado.";
      default -> "Erro inesperado";
    };
  }
}

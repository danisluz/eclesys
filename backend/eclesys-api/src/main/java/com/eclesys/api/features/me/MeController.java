package com.eclesys.api.features.me;

import com.eclesys.api.shared.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class MeController {

  @GetMapping
  public ResponseEntity<ApiResponse<Map<String, Object>>> me(Authentication authentication) {
    Object principal = authentication != null ? authentication.getPrincipal() : null;

    if (!(principal instanceof Map)) {
      throw new RuntimeException("invalid_authenticated_principal");
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> claims = (Map<String, Object>) principal;

    return ResponseEntity.ok(ApiResponse.success(claims));
  }
}

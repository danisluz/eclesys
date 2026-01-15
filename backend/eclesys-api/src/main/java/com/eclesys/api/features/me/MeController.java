package com.eclesys.api.features.me;

import com.eclesys.api.features.me.dto.MeResponse;
import com.eclesys.api.shared.api.ApiResponse;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

  private final MeService meService;

  public MeController(MeService meService) {
    this.meService = meService;
  }

  @GetMapping
  public ResponseEntity<ApiResponse<MeResponse>> me(Authentication authentication) {
    Object principal = authentication != null ? authentication.getPrincipal() : null;

    if (!(principal instanceof Map)) {
      throw new RuntimeException("invalid_authenticated_principal");
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> claims = (Map<String, Object>) principal;

    MeResponse response = meService.getMe(claims);
    return ResponseEntity.ok(ApiResponse.success(response));
  }
}

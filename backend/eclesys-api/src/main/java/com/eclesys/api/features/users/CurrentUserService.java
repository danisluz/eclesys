package com.eclesys.api.features.users;

import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

  public UUID getTenantId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !authentication.isAuthenticated()) {
      throw new IllegalStateException("Usuário não autenticado");
    }

    Object principal = authentication.getPrincipal();

    if (!(principal instanceof Map<?, ?> map)) {
      throw new IllegalStateException("Principal inválido no SecurityContext");
    }

    Object tenantIdValue = map.get("tenantId");
    if (tenantIdValue == null) {
      throw new IllegalStateException("Token não contém tenantId");
    }

    return UUID.fromString(String.valueOf(tenantIdValue));
  }
}

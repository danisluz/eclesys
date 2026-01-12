package com.eclesys.api.features.users;

import com.eclesys.api.domain.user.UserRole;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

  public UUID getTenantId() {
    Map<?, ?> principal = getPrincipalMap();
    Object tenantIdValue = principal.get("tenantId");
    if (tenantIdValue == null) throw new IllegalStateException("Token não contém tenantId");
    return UUID.fromString(String.valueOf(tenantIdValue));
  }

  public UUID getUserId() {
    Map<?, ?> principal = getPrincipalMap();
    Object userIdValue = principal.get("userId");
    if (userIdValue == null) throw new IllegalStateException("Token não contém userId");
    return UUID.fromString(String.valueOf(userIdValue));
  }

  public UserRole getRole() {
    Map<?, ?> principal = getPrincipalMap();
    Object roleValue = principal.get("role");
    if (roleValue == null) throw new IllegalStateException("Token não contém role");
    return UserRole.valueOf(String.valueOf(roleValue));
  }

  public String getTenantCode() {
    Map<?, ?> principal = getPrincipalMap();
    Object tenantCodeValue = principal.get("tenantCode");
    if (tenantCodeValue == null) throw new IllegalStateException("Token não contém tenantCode");
    return String.valueOf(tenantCodeValue);
  }

  private Map<?, ?> getPrincipalMap() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !authentication.isAuthenticated()) {
      throw new IllegalStateException("Usuário não autenticado");
    }

    Object principal = authentication.getPrincipal();

    if (!(principal instanceof Map<?, ?> map)) {
      throw new IllegalStateException("Principal inválido no SecurityContext");
    }

    return map;
  }
}

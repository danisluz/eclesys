package com.eclesys.api.features.me;
import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.tenant.TenantRepository;
import com.eclesys.api.domain.user.UserEntity;
import com.eclesys.api.domain.user.UserRepository;
import com.eclesys.api.features.me.dto.MeResponse;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class MeService {

  private final UserRepository userRepository;
  private final TenantRepository tenantRepository;

  public MeService(UserRepository userRepository, TenantRepository tenantRepository) {
    this.userRepository = userRepository;
    this.tenantRepository = tenantRepository;
  }

  public MeResponse buildMeResponse(Map<String, Object> claims) {
    UUID userId = UUID.fromString(String.valueOf(claims.get("userId")));
    UUID tenantId = UUID.fromString(String.valueOf(claims.get("tenantId")));

    UserEntity userEntity = userRepository
        .findByTenantIdAndId(tenantId, userId)
        .orElseThrow(() -> new RuntimeException("authenticated_user_not_found"));

    String role = String.valueOf(claims.get("role"));
    String tenantCode = String.valueOf(claims.get("tenantCode"));

    String tenantName = tenantRepository
        .findById(tenantId)
        .map(TenantEntity::getName)
        .orElseThrow(() -> new RuntimeException("authenticated_tenant_not_found"));

    return new MeResponse(
        userEntity.getId(),
        userEntity.getName(),
        userEntity.getEmail(),
        role,
        tenantId,
        tenantCode,
        tenantName
    );
  }

  public MeResponse getMe(Map<String, Object> claims) {
    return buildMeResponse(claims);
  }

}

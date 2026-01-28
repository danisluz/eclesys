package com.eclesys.api.features.me.service;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import com.eclesys.api.features.users.entity.UserEntity;
import com.eclesys.api.features.users.repository.UserRepository;
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

    TenantEntity tenant = tenantRepository
        .findById(tenantId)
        .orElseThrow(() -> new RuntimeException("authenticated_tenant_not_found"));

    String tenantName = tenant.getName();
    String tenantLogoUrl = buildVersionedLogoUrl(tenant);

    return new MeResponse(
        userEntity.getId(),
        userEntity.getName(),
        userEntity.getEmail(),
        role,
        tenantId,
        tenantCode,
        tenantName,
        tenantLogoUrl
    );
  }

  public MeResponse getMe(Map<String, Object> claims) {
    return buildMeResponse(claims);
  }

  private String buildVersionedLogoUrl(TenantEntity tenant) {
    String logoUrl = tenant.getLogoUrl();
    if (logoUrl == null || logoUrl.isBlank()) {
      return null;
    }
    long version = tenant.getUpdatedAt() != null ? tenant.getUpdatedAt().toEpochMilli() : System.currentTimeMillis();
    String separator = logoUrl.contains("?") ? "&" : "?";
    return logoUrl + separator + "v=" + version;
  }

}

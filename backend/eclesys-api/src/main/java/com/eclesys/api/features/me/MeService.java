package com.eclesys.api.features.me;
import com.eclesys.api.domain.user.UserEntity;
import com.eclesys.api.domain.user.UserRepository;
import com.eclesys.api.features.me.dto.MeResponse;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class MeService {

  private final UserRepository userRepository;

  public MeService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public MeResponse buildMeResponse(Map<String, Object> claims) {
    UUID userId = UUID.fromString(String.valueOf(claims.get("userId")));
    UUID tenantId = UUID.fromString(String.valueOf(claims.get("tenantId")));

    UserEntity userEntity = userRepository
        .findByTenantIdAndId(tenantId, userId)
        .orElseThrow(() -> new RuntimeException("authenticated_user_not_found"));

    String role = String.valueOf(claims.get("role"));
    String tenantCode = String.valueOf(claims.get("tenantCode"));

    return new MeResponse(
        userEntity.getId(),
        userEntity.getName(),
        userEntity.getEmail(),
        role,
        tenantId,
        tenantCode
    );
  }

  public MeResponse getMe(Map<String, Object> claims) {
    return buildMeResponse(claims);
  }

}

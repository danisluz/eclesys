package com.eclesys.api.features.onboarding.service;

import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import com.eclesys.api.features.users.entity.UserEntity;
import com.eclesys.api.features.users.repository.UserRepository;
import com.eclesys.api.features.users.entity.UserRole;
import com.eclesys.api.features.onboarding.dto.OnboardingRequest;
import com.eclesys.api.features.onboarding.dto.OnboardingResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
public class OnboardingService {

  private TenantRepository tenantRepository;
  private UserRepository userRepository;
  private PasswordEncoder passwordEncoder;

  public OnboardingService(TenantRepository tenantRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.tenantRepository = tenantRepository;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public OnboardingResponse createTenantWithAdmin(OnboardingRequest request) {
    String normalizedTenantCode = request.tenantCode.trim().toLowerCase(Locale.ROOT);

    if (tenantRepository.existsByTenantCode(normalizedTenantCode)) {
      throw new RuntimeException("tenant_code_already_exists");
    }

    TenantEntity tenant = new TenantEntity();
    tenant.setName(request.churchName.trim());
    tenant.setTenantCode(normalizedTenantCode);
    tenant.setLogoUrl(request.logoUrl);
    tenant.setActive(true);

    tenantRepository.save(tenant);

    UserEntity admin = new UserEntity();
    admin.setId(UUID.randomUUID());
    admin.setTenantId(tenant.getId());
    admin.setName(request.adminName.trim());
    admin.setEmail(request.adminEmail.trim().toLowerCase(Locale.ROOT));
    admin.setPasswordHash(passwordEncoder.encode(request.adminPassword));
    admin.setRole(UserRole.ADMIN);
    admin.setActive(true);

    userRepository.save(admin);

    return new OnboardingResponse(
        tenant.getId(),
        tenant.getTenantCode(),
        admin.getId()
    );
  }


}

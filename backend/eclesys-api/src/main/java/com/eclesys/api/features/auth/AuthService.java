package com.eclesys.api.features.auth;

import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.tenant.TenantRepository;
import com.eclesys.api.domain.user.UserEntity;
import com.eclesys.api.domain.user.UserRepository;
import com.eclesys.api.features.auth.dto.LoginRequest;
import com.eclesys.api.features.auth.dto.LoginResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final TenantRepository tenantRepository;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;

  public AuthService(
      TenantRepository tenantRepository,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtTokenService jwtTokenService
  ) {
    this.tenantRepository = tenantRepository;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtTokenService = jwtTokenService;
  }

  public LoginResponse login(String tenantCode, LoginRequest request) {
    String normalizedTenantCode = tenantCode.trim().toLowerCase();
    String normalizedEmail = request.getEmail().trim().toLowerCase();

    TenantEntity tenant = tenantRepository.findByTenantCode(normalizedTenantCode)
        .orElseThrow(() -> new IllegalArgumentException("Tenant inválido."));

    if (!tenant.isActive()) {
      throw new IllegalArgumentException("Tenant inativo.");
    }

    UserEntity user = userRepository.findByTenantIdAndEmail(tenant.getId(), normalizedEmail)
        .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas."));

    if (!user.isActive()) {
      throw new IllegalArgumentException("Usuário inativo.");
    }

    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Credenciais inválidas.");
    }

    String token = jwtTokenService.generateToken(user, tenant);
    return new LoginResponse(token);
  }
}

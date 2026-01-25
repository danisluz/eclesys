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

    System.out.println("=== LOGIN DEBUG ===");
    System.out.println("Tenant Code recebido: '" + tenantCode + "'");
    System.out.println("Tenant Code normalizado: '" + normalizedTenantCode + "'");
    System.out.println("Email recebido: '" + request.getEmail() + "'");
    System.out.println("Email normalizado: '" + normalizedEmail + "'");

    TenantEntity tenant = tenantRepository.findByTenantCode(normalizedTenantCode)
        .orElseThrow(() -> {
          System.out.println("❌ ERRO: Tenant não encontrado para código: " + normalizedTenantCode);
          return new IllegalArgumentException("Tenant inválido.");
        });

    System.out.println("✅ Tenant encontrado: " + tenant.getName() + " (ID: " + tenant.getId() + ")");

    if (!tenant.isActive()) {
      System.out.println("❌ ERRO: Tenant inativo");
      throw new IllegalArgumentException("Tenant inativo.");
    }

    UserEntity user = userRepository.findByTenantIdAndEmail(tenant.getId(), normalizedEmail)
        .orElseThrow(() -> {
          System.out.println("❌ ERRO: Usuário não encontrado para email: " + normalizedEmail + " no tenant: " + tenant.getId());
          return new IllegalArgumentException("Credenciais inválidas.");
        });

    System.out.println("✅ Usuário encontrado: " + user.getName() + " (ID: " + user.getId() + ")");
    System.out.println("Hash armazenado: " + user.getPasswordHash());
    System.out.println("Senha fornecida: " + request.getPassword());

    if (!user.isActive()) {
      System.out.println("❌ ERRO: Usuário inativo");
      throw new IllegalArgumentException("Usuário inativo.");
    }

    boolean passwordMatch = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
    System.out.println("Senha match? " + passwordMatch);

    if (!passwordMatch) {
      System.out.println("❌ ERRO: Senha incorreta");
      throw new IllegalArgumentException("Credenciais inválidas.");
    }

    System.out.println("✅ Login bem-sucedido!");
    String token = jwtTokenService.generateToken(user, tenant);
    return new LoginResponse(token);
  }
}

package com.eclesys.api.features.communion.infrastructure.adapter;

import com.eclesys.api.features.communion.application.port.ChurchLogoPort;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import com.eclesys.api.features.tenants.service.TenantLogoService;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ChurchLogoAdapter implements ChurchLogoPort {

  private final TenantRepository tenantRepository;
  private final TenantLogoService tenantLogoService;

  public ChurchLogoAdapter(TenantRepository tenantRepository, TenantLogoService tenantLogoService) {
    this.tenantRepository = tenantRepository;
    this.tenantLogoService = tenantLogoService;
  }

  @Override
  public Optional<byte[]> loadLogo(UUID tenantId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    if (tenant.getLogoUrl() == null || tenant.getLogoUrl().isBlank()) {
      return Optional.empty();
    }

    try {
      Path path = tenantLogoService.loadLogoPath(tenant.getTenantCode());
      if (!Files.exists(path)) {
        return Optional.empty();
      }
      return Optional.of(Files.readAllBytes(path));
    } catch (Exception ex) {
      return Optional.empty();
    }
  }
}

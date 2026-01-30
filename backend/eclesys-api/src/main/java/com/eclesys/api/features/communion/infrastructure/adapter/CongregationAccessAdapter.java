package com.eclesys.api.features.communion.infrastructure.adapter;

import com.eclesys.api.features.communion.application.port.CongregationAccessPort;
import com.eclesys.api.features.communion.application.port.CongregationInfo;
import com.eclesys.api.features.communion.application.port.OrganizationUnitScopeType;
import com.eclesys.api.features.organizations.entity.OrganizationUnit;
import com.eclesys.api.features.organizations.entity.OrganizationUnitType;
import com.eclesys.api.features.organizations.repository.OrganizationUnitRepository;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class CongregationAccessAdapter implements CongregationAccessPort {

  private final OrganizationUnitRepository organizationUnitRepository;
  private final TenantRepository tenantRepository;

  public CongregationAccessAdapter(
      OrganizationUnitRepository organizationUnitRepository,
      TenantRepository tenantRepository
  ) {
    this.organizationUnitRepository = organizationUnitRepository;
    this.tenantRepository = tenantRepository;
  }

  @Override
  public CongregationInfo getCongregation(UUID tenantId, UUID congregationId) {
    TenantEntity tenant = getTenant(tenantId);
    OrganizationUnit unit = organizationUnitRepository.findByTenantAndId(tenant, congregationId)
        .orElseThrow(() -> new IllegalArgumentException("Congregação não encontrada"));

    return new CongregationInfo(
        unit.getId(),
        toScopeType(unit.getType()),
        unit.getParent() != null ? unit.getParent().getId() : null
    );
  }

  @Override
  public List<UUID> listCongregationsBySector(UUID tenantId, UUID sectorId) {
    TenantEntity tenant = getTenant(tenantId);
    OrganizationUnit sector = organizationUnitRepository.findByTenantAndId(tenant, sectorId)
        .orElseThrow(() -> new IllegalArgumentException("Setor não encontrado"));

    if (sector.getType() != OrganizationUnitType.SECTOR) {
      throw new IllegalArgumentException("Unidade informada não é um setor");
    }

    return organizationUnitRepository.findAllByTenantAndParentId(tenant, sectorId)
        .stream()
        .filter(unit -> unit.getType() == OrganizationUnitType.CONGREGATION)
        .map(OrganizationUnit::getId)
        .toList();
  }

  private TenantEntity getTenant(UUID tenantId) {
    return tenantRepository.findById(tenantId)
        .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado"));
  }

  private OrganizationUnitScopeType toScopeType(OrganizationUnitType type) {
    return switch (type) {
      case CHURCH -> OrganizationUnitScopeType.CHURCH;
      case SECTOR -> OrganizationUnitScopeType.SECTOR;
      case CONGREGATION -> OrganizationUnitScopeType.CONGREGATION;
    };
  }
}

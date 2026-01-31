package com.eclesys.api.features.communion.infrastructure.adapter;

import com.eclesys.api.features.communion.application.port.ChurchInfo;
import com.eclesys.api.features.communion.application.port.OrganizationHierarchy;
import com.eclesys.api.features.communion.application.port.OrganizationHierarchyPort;
import com.eclesys.api.features.communion.application.port.OrganizationUnitSummary;
import com.eclesys.api.features.organizations.entity.OrganizationUnit;
import com.eclesys.api.features.organizations.repository.OrganizationUnitRepository;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrganizationHierarchyAdapter implements OrganizationHierarchyPort {

  private final OrganizationUnitRepository organizationUnitRepository;
  private final TenantRepository tenantRepository;

  public OrganizationHierarchyAdapter(
      OrganizationUnitRepository organizationUnitRepository,
      TenantRepository tenantRepository
  ) {
    this.organizationUnitRepository = organizationUnitRepository;
    this.tenantRepository = tenantRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public OrganizationHierarchy getHierarchyByCongregation(UUID tenantId, UUID congregationId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    OrganizationUnit congregation = organizationUnitRepository
        .findByTenantAndIdWithParents(tenant, congregationId)
        .orElseThrow(() -> new RuntimeException("Congregação não encontrada"));

    OrganizationUnit sector = congregation.getParent();
    if (sector == null) {
      throw new IllegalArgumentException("Congregação sem setor associado");
    }

    OrganizationUnit church = sector.getParent();
    if (church == null) {
      throw new IllegalArgumentException("Setor sem sede associada");
    }

    ChurchInfo churchInfo = new ChurchInfo(
        church.getId(),
        church.getName(),
        church.getSectorLabel(),
        church.getCongregationLabel(),
        church.getContactEmail(),
        church.getContactPhone(),
        church.getWebsite(),
        church.getAddress()
    );

    OrganizationUnitSummary sectorSummary = new OrganizationUnitSummary(sector.getId(), sector.getName());
    OrganizationUnitSummary congregationSummary = new OrganizationUnitSummary(congregation.getId(), congregation.getName());

    return new OrganizationHierarchy(churchInfo, sectorSummary, congregationSummary);
  }
}

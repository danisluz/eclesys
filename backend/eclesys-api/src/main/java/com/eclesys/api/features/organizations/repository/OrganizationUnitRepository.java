package com.eclesys.api.features.organizations.repository;

import com.eclesys.api.features.organizations.entity.OrganizationUnit;
import com.eclesys.api.features.organizations.entity.OrganizationUnitStatus;
import com.eclesys.api.features.organizations.entity.OrganizationUnitType;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationUnitRepository extends JpaRepository<OrganizationUnit, UUID> {

  List<OrganizationUnit> findAllByTenant(TenantEntity tenant);

  List<OrganizationUnit> findAllByTenantAndType(TenantEntity tenant, OrganizationUnitType type);

  List<OrganizationUnit> findAllByTenantAndParentIsNull(TenantEntity tenant);

  List<OrganizationUnit> findAllByTenantAndParent(TenantEntity tenant, OrganizationUnit parent);

  Optional<OrganizationUnit> findByTenantAndId(TenantEntity tenant, UUID id);

  boolean existsByTenantAndType(TenantEntity tenant, OrganizationUnitType type);

  long countByTenant(TenantEntity tenant);

  long countByTenantAndStatus(TenantEntity tenant, OrganizationUnitStatus status);

  @Query("SELECT ou FROM OrganizationUnit ou WHERE ou.tenant = :tenant AND ou.parent.id = :parentId")
  List<OrganizationUnit> findAllByTenantAndParentId(@Param("tenant") TenantEntity tenant, @Param("parentId") UUID parentId);

  @Query("SELECT COUNT(ou) > 0 FROM OrganizationUnit ou WHERE ou.parent.id = :parentId")
  boolean hasChildren(@Param("parentId") UUID parentId);
}

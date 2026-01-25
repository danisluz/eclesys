package com.eclesys.api.domain.churchrole;

import com.eclesys.api.domain.tenant.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChurchRoleRepository extends JpaRepository<ChurchRole, UUID> {

  List<ChurchRole> findAllByTenantOrderBySortOrderAsc(TenantEntity tenant);

  List<ChurchRole> findAllByTenantAndIsActiveTrueOrderBySortOrderAsc(TenantEntity tenant);

  Optional<ChurchRole> findByTenantAndId(TenantEntity tenant, UUID id);

  boolean existsByTenantAndNameIgnoreCase(TenantEntity tenant, String name);
}

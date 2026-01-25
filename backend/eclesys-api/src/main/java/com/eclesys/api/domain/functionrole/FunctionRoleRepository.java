package com.eclesys.api.domain.functionrole;

import com.eclesys.api.domain.tenant.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FunctionRoleRepository extends JpaRepository<FunctionRole, UUID> {

  List<FunctionRole> findAllByTenantOrderBySortOrderAsc(TenantEntity tenant);

  List<FunctionRole> findAllByTenantAndIsActiveTrueOrderBySortOrderAsc(TenantEntity tenant);

  Optional<FunctionRole> findByTenantAndId(TenantEntity tenant, UUID id);

  boolean existsByTenantAndNameIgnoreCase(TenantEntity tenant, String name);
}

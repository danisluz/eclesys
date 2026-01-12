package com.eclesys.api.domain.tenant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {
  Optional<TenantEntity> findByTenantCode(String tenantCode);
  boolean existsByTenantCode(String tenantCode);
}

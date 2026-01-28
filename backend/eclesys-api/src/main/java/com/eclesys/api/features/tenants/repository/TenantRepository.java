package com.eclesys.api.features.tenants.repository;

import com.eclesys.api.features.tenants.entity.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {
  Optional<TenantEntity> findByTenantCode(String tenantCode);
  boolean existsByTenantCode(String tenantCode);
}

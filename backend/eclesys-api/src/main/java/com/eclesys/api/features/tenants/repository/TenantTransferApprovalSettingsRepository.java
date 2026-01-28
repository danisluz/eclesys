package com.eclesys.api.features.tenants.repository;

import com.eclesys.api.features.tenants.entity.TenantTransferApprovalSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantTransferApprovalSettingsRepository extends JpaRepository<TenantTransferApprovalSettings, UUID> {
  Optional<TenantTransferApprovalSettings> findByTenantId(UUID tenantId);
}

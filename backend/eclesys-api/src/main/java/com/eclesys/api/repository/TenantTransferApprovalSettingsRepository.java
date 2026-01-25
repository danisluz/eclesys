package com.eclesys.api.repository;

import com.eclesys.api.domain.tenant.TenantTransferApprovalSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantTransferApprovalSettingsRepository extends JpaRepository<TenantTransferApprovalSettings, UUID> {
  Optional<TenantTransferApprovalSettings> findByTenantId(UUID tenantId);
}

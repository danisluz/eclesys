package com.eclesys.api.features.members.repository;

import com.eclesys.api.features.members.entity.Member;
import com.eclesys.api.features.members.entity.MemberTransfer;
import com.eclesys.api.features.members.entity.TransferStatus;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemberTransferRepository extends JpaRepository<MemberTransfer, UUID> {

  List<MemberTransfer> findByTenantAndMemberOrderByCreatedAtDesc(TenantEntity tenant, Member member);

  List<MemberTransfer> findByTenantOrderByCreatedAtDesc(TenantEntity tenant);

  List<MemberTransfer> findByTenantIdAndStatus(UUID tenantId, TransferStatus status);

  List<MemberTransfer> findByTenantIdAndRequestedByIdAndStatus(UUID tenantId, UUID requestedById, TransferStatus status);
}

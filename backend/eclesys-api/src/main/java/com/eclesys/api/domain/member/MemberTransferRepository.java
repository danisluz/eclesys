package com.eclesys.api.domain.member;

import com.eclesys.api.domain.tenant.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemberTransferRepository extends JpaRepository<MemberTransfer, UUID> {

  List<MemberTransfer> findByTenantAndMemberOrderByCreatedAtDesc(TenantEntity tenant, Member member);

  List<MemberTransfer> findByTenantOrderByCreatedAtDesc(TenantEntity tenant);
}

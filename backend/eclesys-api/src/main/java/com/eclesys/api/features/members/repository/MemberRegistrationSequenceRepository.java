package com.eclesys.api.features.members.repository;

import com.eclesys.api.features.members.entity.MemberRegistrationSequence;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface MemberRegistrationSequenceRepository
    extends JpaRepository<MemberRegistrationSequence, UUID> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT s FROM MemberRegistrationSequence s WHERE s.tenantId = :tenantId")
  Optional<MemberRegistrationSequence> findByTenantIdForUpdate(
      @Param("tenantId") UUID tenantId);
}

package com.eclesys.api.features.members.repository;

import com.eclesys.api.features.members.entity.MemberPositionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemberPositionHistoryRepository extends JpaRepository<MemberPositionHistory, UUID> {

  /**
   * Busca o histórico de cargos de um membro ordenado por data decrescente
   */
  List<MemberPositionHistory> findByMemberIdOrderByChangedAtDesc(UUID memberId);

  /**
   * Busca o histórico de cargos de um tenant ordenado por data decrescente
   */
  List<MemberPositionHistory> findByTenantIdOrderByChangedAtDesc(UUID tenantId);
}

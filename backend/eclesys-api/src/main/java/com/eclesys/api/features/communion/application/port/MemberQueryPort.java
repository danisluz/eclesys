package com.eclesys.api.features.communion.application.port;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface MemberQueryPort {
  List<MemberSummary> listMembersByCongregation(UUID tenantId, UUID congregationId);

  Optional<MemberSummary> findMemberByRegistrationNumber(
      UUID tenantId,
      UUID congregationId,
      String registrationNumber
  );

  boolean isMemberInCongregation(UUID tenantId, UUID congregationId, UUID memberId);

  Map<UUID, Integer> countActiveMembersByCongregations(UUID tenantId, Set<UUID> congregationIds);
}

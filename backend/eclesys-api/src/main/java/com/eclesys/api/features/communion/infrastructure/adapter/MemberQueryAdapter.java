package com.eclesys.api.features.communion.infrastructure.adapter;

import com.eclesys.api.features.communion.application.port.MemberQueryPort;
import com.eclesys.api.features.communion.application.port.MemberSummary;
import com.eclesys.api.features.members.entity.Member;
import com.eclesys.api.features.members.entity.MemberStatus;
import com.eclesys.api.features.members.repository.MemberRepository;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class MemberQueryAdapter implements MemberQueryPort {

  private static final int REGISTRATION_NUMBER_WIDTH = 6;

  private final MemberRepository memberRepository;
  private final TenantRepository tenantRepository;

  public MemberQueryAdapter(MemberRepository memberRepository, TenantRepository tenantRepository) {
    this.memberRepository = memberRepository;
    this.tenantRepository = tenantRepository;
  }

  @Override
  public List<MemberSummary> listMembersByCongregation(UUID tenantId, UUID congregationId) {
    TenantEntity tenant = getTenant(tenantId);
    List<Member> members = memberRepository
        .findAllByTenantAndOrganizationUnit_IdAndStatusOrderByFullNameAsc(
            tenant,
            congregationId,
            MemberStatus.ACTIVE
        );

    return members.stream()
        .map(member -> new MemberSummary(
            member.getId(),
            member.getFullName(),
            formatRegistrationNumber(member.getRegistrationNumber())
        ))
        .toList();
  }

  @Override
  public Optional<MemberSummary> findMemberByRegistrationNumber(
      UUID tenantId,
      UUID congregationId,
      String registrationNumber
  ) {
    TenantEntity tenant = getTenant(tenantId);
    Integer parsed = parseRegistrationNumber(registrationNumber);

    return memberRepository.findByTenantAndOrganizationUnit_IdAndRegistrationNumber(
        tenant,
        congregationId,
        parsed
    ).map(member -> new MemberSummary(
        member.getId(),
        member.getFullName(),
        formatRegistrationNumber(member.getRegistrationNumber())
    ));
  }

  @Override
  public boolean isMemberInCongregation(UUID tenantId, UUID congregationId, UUID memberId) {
    TenantEntity tenant = getTenant(tenantId);
    return memberRepository.existsByTenantAndOrganizationUnit_IdAndId(tenant, congregationId, memberId);
  }

  @Override
  public Map<UUID, Integer> countActiveMembersByCongregations(UUID tenantId, Set<UUID> congregationIds) {
    Map<UUID, Integer> result = new HashMap<>();
    if (congregationIds == null || congregationIds.isEmpty()) {
      return result;
    }

    TenantEntity tenant = getTenant(tenantId);
    List<Object[]> rows = memberRepository.countByTenantAndOrganizationUnitIdsAndStatus(
        tenant,
        List.copyOf(congregationIds),
        MemberStatus.ACTIVE
    );

    for (Object[] row : rows) {
      UUID congregationId = (UUID) row[0];
      Long count = (Long) row[1];
      result.put(congregationId, count == null ? 0 : count.intValue());
    }

    return result;
  }

  private TenantEntity getTenant(UUID tenantId) {
    return tenantRepository.findById(tenantId)
        .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado"));
  }

  private Integer parseRegistrationNumber(String registrationNumber) {
    if (registrationNumber == null || registrationNumber.isBlank()) {
      throw new IllegalArgumentException("Matrícula inválida");
    }
    if (!registrationNumber.matches("\\d+")) {
      throw new IllegalArgumentException("Matrícula inválida");
    }
    return Integer.parseInt(registrationNumber);
  }

  private String formatRegistrationNumber(Integer registrationNumber) {
    if (registrationNumber == null) return null;
    return String.format("%0" + REGISTRATION_NUMBER_WIDTH + "d", registrationNumber);
  }
}

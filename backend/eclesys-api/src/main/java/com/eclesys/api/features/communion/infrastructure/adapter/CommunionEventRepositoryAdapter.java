package com.eclesys.api.features.communion.infrastructure.adapter;

import com.eclesys.api.features.communion.application.port.CommunionEventRepository;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import com.eclesys.api.features.communion.infrastructure.persistence.CommunionEventJpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class CommunionEventRepositoryAdapter implements CommunionEventRepository {

  private final CommunionEventJpaRepository jpaRepository;

  public CommunionEventRepositoryAdapter(CommunionEventJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public CommunionEvent save(CommunionEvent event) {
    return jpaRepository.save(event);
  }

  @Override
  public Optional<CommunionEvent> findByIdAndTenantId(UUID tenantId, UUID eventId) {
    return jpaRepository.findByIdAndTenantId(eventId, tenantId);
  }

  @Override
  public Optional<CommunionEvent> findByTenantAndCongregationAndDate(
      UUID tenantId,
      UUID congregationId,
      LocalDate eventDate
  ) {
    return jpaRepository.findByTenantIdAndCongregationIdAndEventDate(tenantId, congregationId, eventDate);
  }

  @Override
  public List<CommunionEvent> search(
      UUID tenantId,
      List<UUID> congregationIds,
      LocalDate from,
      LocalDate to,
      CommunionEventStatus status
  ) {
    if (congregationIds == null) {
      return jpaRepository.searchAll(tenantId, from, to, status);
    }
    if (congregationIds.isEmpty()) {
      return List.of();
    }
    return jpaRepository.searchByCongregations(tenantId, congregationIds, from, to, status);
  }
}

package com.eclesys.api.features.communion.application.port;

import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommunionEventRepository {
  CommunionEvent save(CommunionEvent event);

  Optional<CommunionEvent> findByIdAndTenantId(UUID tenantId, UUID eventId);

  Optional<CommunionEvent> findByTenantAndCongregationAndDate(
      UUID tenantId,
      UUID congregationId,
      LocalDate eventDate
  );

  List<CommunionEvent> search(
      UUID tenantId,
      List<UUID> congregationIds,
      LocalDate from,
      LocalDate to,
      CommunionEventStatus status
  );
}

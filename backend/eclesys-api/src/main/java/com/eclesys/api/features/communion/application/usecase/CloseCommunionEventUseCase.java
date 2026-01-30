package com.eclesys.api.features.communion.application.usecase;

import com.eclesys.api.features.communion.application.CommunionAccessService;
import com.eclesys.api.features.communion.application.port.CommunionEventRepository;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.users.entity.UserRole;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CloseCommunionEventUseCase {

  private final CommunionEventRepository eventRepository;
  private final CommunionAccessService accessService;

  public CloseCommunionEventUseCase(
      CommunionEventRepository eventRepository,
      CommunionAccessService accessService
  ) {
    this.eventRepository = eventRepository;
    this.accessService = accessService;
  }

  public CommunionEvent execute(UUID tenantId, UUID userId, UserRole userRole, UUID eventId) {
    CommunionEvent event = eventRepository.findByIdAndTenantId(tenantId, eventId)
        .orElseThrow(() -> new IllegalArgumentException("Evento de Santa Ceia não encontrado"));

    accessService.assertCanManageEvent(tenantId, userId, userRole, event.getCongregationId());

    event.close();
    return eventRepository.save(event);
  }
}

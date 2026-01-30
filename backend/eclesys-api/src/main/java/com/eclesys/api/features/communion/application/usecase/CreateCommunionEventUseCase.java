package com.eclesys.api.features.communion.application.usecase;

import com.eclesys.api.features.communion.application.CommunionAccessService;
import com.eclesys.api.features.communion.application.port.CommunionEventRepository;
import com.eclesys.api.features.communion.application.port.CongregationAccessPort;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.users.entity.UserRole;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CreateCommunionEventUseCase {

  private final CommunionEventRepository eventRepository;
  private final CongregationAccessPort congregationAccessPort;
  private final CommunionAccessService accessService;

  public CreateCommunionEventUseCase(
      CommunionEventRepository eventRepository,
      CongregationAccessPort congregationAccessPort,
      CommunionAccessService accessService
  ) {
    this.eventRepository = eventRepository;
    this.congregationAccessPort = congregationAccessPort;
    this.accessService = accessService;
  }

  public CommunionEvent execute(
      UUID tenantId,
      UUID userId,
      UserRole userRole,
      UUID congregationId,
      LocalDate eventDate
  ) {
    if (eventDate == null) {
      throw new IllegalArgumentException("Data do evento é obrigatória");
    }

    congregationAccessPort.getCongregation(tenantId, congregationId);
    accessService.assertCanManageEvent(tenantId, userId, userRole, congregationId);

    eventRepository.findByTenantAndCongregationAndDate(tenantId, congregationId, eventDate)
        .ifPresent(existing -> {
          throw new IllegalArgumentException("Já existe um evento de Santa Ceia para esta data");
        });

    CommunionEvent event = new CommunionEvent();
    event.setTenantId(tenantId);
    event.setCongregationId(congregationId);
    event.setEventDate(eventDate);
    event.setCreatedByUserId(userId);

    return eventRepository.save(event);
  }
}

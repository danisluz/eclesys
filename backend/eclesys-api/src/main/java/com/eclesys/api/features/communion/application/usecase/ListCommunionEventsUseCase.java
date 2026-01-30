package com.eclesys.api.features.communion.application.usecase;

import com.eclesys.api.features.communion.application.CommunionAccessService;
import com.eclesys.api.features.communion.application.CommunionEventSummary;
import com.eclesys.api.features.communion.application.port.CommunionAttendanceRepository;
import com.eclesys.api.features.communion.application.port.CommunionEventRepository;
import com.eclesys.api.features.communion.application.port.MemberQueryPort;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import com.eclesys.api.features.users.entity.UserRole;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ListCommunionEventsUseCase {

  private final CommunionEventRepository eventRepository;
  private final CommunionAccessService accessService;
  private final MemberQueryPort memberQueryPort;
  private final CommunionAttendanceRepository attendanceRepository;

  public ListCommunionEventsUseCase(
      CommunionEventRepository eventRepository,
      CommunionAccessService accessService,
      MemberQueryPort memberQueryPort,
      CommunionAttendanceRepository attendanceRepository
  ) {
    this.eventRepository = eventRepository;
    this.accessService = accessService;
    this.memberQueryPort = memberQueryPort;
    this.attendanceRepository = attendanceRepository;
  }

  public List<CommunionEventSummary> execute(
      UUID tenantId,
      UUID userId,
      UserRole userRole,
      UUID congregationId,
      LocalDate from,
      LocalDate to,
      CommunionEventStatus status
  ) {
    List<CommunionEvent> events;
    if (congregationId != null) {
      accessService.assertCanViewOrRecord(tenantId, userId, userRole, congregationId);
      events = eventRepository.search(tenantId, List.of(congregationId), from, to, status);
    } else {
      List<UUID> accessible = accessService.listAccessibleCongregations(tenantId, userId, userRole);
      events = eventRepository.search(tenantId, accessible, from, to, status);
    }

    if (events.isEmpty()) {
      return List.of();
    }

    Set<UUID> congregationIds = events.stream()
        .map(CommunionEvent::getCongregationId)
        .collect(Collectors.toSet());
    Map<UUID, Integer> totalsByCongregation =
        memberQueryPort.countActiveMembersByCongregations(tenantId, congregationIds);

    List<UUID> eventIds = events.stream()
        .map(CommunionEvent::getId)
        .toList();
    Map<UUID, Integer> presentByEvent = attendanceRepository.countPresentByEventIds(eventIds);

    return events.stream()
        .map(event -> {
          Integer total = totalsByCongregation.getOrDefault(event.getCongregationId(), 0);
          Integer present = presentByEvent.getOrDefault(event.getId(), 0);
          Integer percent = total != null && total > 0
              ? Math.toIntExact(Math.round((present * 100.0) / total))
              : null;
          return new CommunionEventSummary(event, total, present, percent);
        })
        .toList();
  }
}

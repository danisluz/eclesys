package com.eclesys.api.features.communion.application.usecase;

import com.eclesys.api.features.communion.application.CommunionAccessService;
import com.eclesys.api.features.communion.application.CommunionEventDetails;
import com.eclesys.api.features.communion.application.MemberAttendanceView;
import com.eclesys.api.features.communion.application.port.CommunionAttendanceRepository;
import com.eclesys.api.features.communion.application.port.CommunionEventRepository;
import com.eclesys.api.features.communion.application.port.MemberQueryPort;
import com.eclesys.api.features.communion.application.port.MemberSummary;
import com.eclesys.api.features.communion.domain.CommunionAttendance;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.users.entity.UserRole;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GetCommunionEventUseCase {

  private final CommunionEventRepository eventRepository;
  private final CommunionAttendanceRepository attendanceRepository;
  private final MemberQueryPort memberQueryPort;
  private final CommunionAccessService accessService;

  public GetCommunionEventUseCase(
      CommunionEventRepository eventRepository,
      CommunionAttendanceRepository attendanceRepository,
      MemberQueryPort memberQueryPort,
      CommunionAccessService accessService
  ) {
    this.eventRepository = eventRepository;
    this.attendanceRepository = attendanceRepository;
    this.memberQueryPort = memberQueryPort;
    this.accessService = accessService;
  }

  public CommunionEventDetails execute(UUID tenantId, UUID userId, UserRole userRole, UUID eventId) {
    CommunionEvent event = eventRepository.findByIdAndTenantId(tenantId, eventId)
        .orElseThrow(() -> new IllegalArgumentException("Evento de Santa Ceia não encontrado"));

    accessService.assertCanViewOrRecord(tenantId, userId, userRole, event.getCongregationId());

    List<MemberSummary> members = memberQueryPort.listMembersByCongregation(tenantId, event.getCongregationId());
    List<CommunionAttendance> attendances = attendanceRepository.findByEventId(event.getId());

    Map<UUID, Boolean> presenceByMember = new HashMap<>();
    for (CommunionAttendance attendance : attendances) {
      presenceByMember.put(attendance.getMemberId(), Boolean.TRUE.equals(attendance.getPresent()));
    }

    List<MemberAttendanceView> attendanceViews = members.stream()
        .map(member -> new MemberAttendanceView(
            member.id(),
            member.fullName(),
            member.registrationNumber(),
            presenceByMember.getOrDefault(member.id(), false)
        ))
        .toList();

    return new CommunionEventDetails(event, attendanceViews);
  }
}

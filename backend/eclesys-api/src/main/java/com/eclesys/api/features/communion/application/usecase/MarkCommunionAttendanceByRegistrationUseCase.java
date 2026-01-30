package com.eclesys.api.features.communion.application.usecase;

import com.eclesys.api.features.communion.application.AttendanceRecordResult;
import com.eclesys.api.features.communion.application.CommunionAccessService;
import com.eclesys.api.features.communion.application.port.CommunionAttendanceRepository;
import com.eclesys.api.features.communion.application.port.CommunionEventRepository;
import com.eclesys.api.features.communion.application.port.MemberQueryPort;
import com.eclesys.api.features.communion.application.port.MemberSummary;
import com.eclesys.api.features.communion.domain.AttendanceSource;
import com.eclesys.api.features.communion.domain.AttendanceStatus;
import com.eclesys.api.features.communion.domain.CommunionAttendance;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import com.eclesys.api.features.users.entity.UserRole;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class MarkCommunionAttendanceByRegistrationUseCase {

  private final CommunionEventRepository eventRepository;
  private final CommunionAttendanceRepository attendanceRepository;
  private final MemberQueryPort memberQueryPort;
  private final CommunionAccessService accessService;

  public MarkCommunionAttendanceByRegistrationUseCase(
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

  public AttendanceRecordResult execute(
      UUID tenantId,
      UUID userId,
      UserRole userRole,
      UUID eventId,
      String registrationNumber
  ) {
    if (registrationNumber == null || registrationNumber.isBlank()) {
      throw new IllegalArgumentException("Matrícula é obrigatória");
    }

    CommunionEvent event = eventRepository.findByIdAndTenantId(tenantId, eventId)
        .orElseThrow(() -> new IllegalArgumentException("Evento de Santa Ceia não encontrado"));

    accessService.assertCanViewOrRecord(tenantId, userId, userRole, event.getCongregationId());

    if (event.getStatus() != CommunionEventStatus.OPEN) {
      throw new IllegalStateException("Evento precisa estar aberto para registrar presença");
    }

    MemberSummary member = memberQueryPort
        .findMemberByRegistrationNumber(tenantId, event.getCongregationId(), registrationNumber)
        .orElseThrow(() -> new IllegalArgumentException("Matrícula não encontrada na congregação"));

    CommunionAttendance attendance = attendanceRepository
        .findByEventIdAndMemberId(event.getId(), member.id())
        .orElseGet(CommunionAttendance::new);

    attendance.setEventId(event.getId());
    attendance.setMemberId(member.id());
    attendance.setAttendanceStatus(AttendanceStatus.PRESENT);
    attendance.setPresent(true);
    attendance.setRecordedByUserId(userId);
    attendance.setRecordedAt(LocalDateTime.now());
    attendance.setSource(AttendanceSource.ONLINE);

    attendanceRepository.save(attendance);

    return new AttendanceRecordResult(
        event.getId(),
        member.id(),
        true,
        AttendanceStatus.PRESENT,
        attendance.getNote()
    );
  }
}

package com.eclesys.api.features.communion.application.usecase;

import com.eclesys.api.features.communion.application.AttendanceUpdateItem;
import com.eclesys.api.features.communion.application.AttendanceUpdateResult;
import com.eclesys.api.features.communion.application.CommunionAccessService;
import com.eclesys.api.features.communion.application.port.CommunionAttendanceRepository;
import com.eclesys.api.features.communion.application.port.CommunionEventRepository;
import com.eclesys.api.features.communion.application.port.MemberQueryPort;
import com.eclesys.api.features.communion.domain.AttendanceSource;
import com.eclesys.api.features.communion.domain.AttendanceStatus;
import com.eclesys.api.features.communion.domain.CommunionAttendance;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import com.eclesys.api.features.users.entity.UserRole;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class UpdateCommunionAttendanceBatchUseCase {

  private final CommunionEventRepository eventRepository;
  private final CommunionAttendanceRepository attendanceRepository;
  private final MemberQueryPort memberQueryPort;
  private final CommunionAccessService accessService;

  public UpdateCommunionAttendanceBatchUseCase(
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

  public AttendanceUpdateResult execute(
      UUID tenantId,
      UUID userId,
      UserRole userRole,
      UUID eventId,
      List<AttendanceUpdateItem> items,
      AttendanceSource source
  ) {
    if (items == null || items.isEmpty()) {
      throw new IllegalArgumentException("Lista de presenças não pode ser vazia");
    }

    CommunionEvent event = eventRepository.findByIdAndTenantId(tenantId, eventId)
        .orElseThrow(() -> new IllegalArgumentException("Evento de Santa Ceia não encontrado"));

    accessService.assertCanViewOrRecord(tenantId, userId, userRole, event.getCongregationId());

    if (event.getStatus() != CommunionEventStatus.OPEN) {
      throw new IllegalStateException("Evento precisa estar aberto para registrar presença");
    }

    int updatedCount = 0;
    for (AttendanceUpdateItem item : items) {
      if (!memberQueryPort.isMemberInCongregation(tenantId, event.getCongregationId(), item.memberId())) {
        throw new IllegalArgumentException("Membro não pertence à congregação do evento");
      }

      CommunionAttendance attendance = attendanceRepository
          .findByEventIdAndMemberId(event.getId(), item.memberId())
          .orElseGet(CommunionAttendance::new);

      attendance.setEventId(event.getId());
      attendance.setMemberId(item.memberId());
      AttendanceStatus status = item.status();
      if (status == null) {
        status = item.present() ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;
      }
      attendance.setAttendanceStatus(status);
      attendance.setPresent(status == AttendanceStatus.PRESENT);
      attendance.setNote(item.note());
      attendance.setRecordedByUserId(userId);
      attendance.setRecordedAt(LocalDateTime.now());
      attendance.setSource(source != null ? source : AttendanceSource.ONLINE);

      attendanceRepository.save(attendance);
      updatedCount++;
    }

    return new AttendanceUpdateResult(updatedCount);
  }
}

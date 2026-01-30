package com.eclesys.api.features.communion.application.port;

import com.eclesys.api.features.communion.domain.CommunionAttendance;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface CommunionAttendanceRepository {
  CommunionAttendance save(CommunionAttendance attendance);

  Optional<CommunionAttendance> findByEventIdAndMemberId(UUID eventId, UUID memberId);

  List<CommunionAttendance> findByEventId(UUID eventId);

  List<CommunionAttendance> findByEventIdAndMemberIds(UUID eventId, List<UUID> memberIds);

  Map<UUID, Integer> countPresentByEventIds(List<UUID> eventIds);
}

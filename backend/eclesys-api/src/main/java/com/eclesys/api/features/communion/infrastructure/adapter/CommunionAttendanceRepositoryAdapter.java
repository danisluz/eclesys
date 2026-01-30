package com.eclesys.api.features.communion.infrastructure.adapter;

import com.eclesys.api.features.communion.application.port.CommunionAttendanceRepository;
import com.eclesys.api.features.communion.domain.CommunionAttendance;
import com.eclesys.api.features.communion.infrastructure.persistence.CommunionAttendanceJpaRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class CommunionAttendanceRepositoryAdapter implements CommunionAttendanceRepository {

  private final CommunionAttendanceJpaRepository jpaRepository;

  public CommunionAttendanceRepositoryAdapter(CommunionAttendanceJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public CommunionAttendance save(CommunionAttendance attendance) {
    return jpaRepository.save(attendance);
  }

  @Override
  public Optional<CommunionAttendance> findByEventIdAndMemberId(UUID eventId, UUID memberId) {
    return jpaRepository.findByEventIdAndMemberId(eventId, memberId);
  }

  @Override
  public List<CommunionAttendance> findByEventId(UUID eventId) {
    return jpaRepository.findAllByEventId(eventId);
  }

  @Override
  public List<CommunionAttendance> findByEventIdAndMemberIds(UUID eventId, List<UUID> memberIds) {
    if (memberIds == null || memberIds.isEmpty()) {
      return List.of();
    }
    return jpaRepository.findByEventIdAndMemberIdIn(eventId, memberIds);
  }

  @Override
  public Map<UUID, Integer> countPresentByEventIds(List<UUID> eventIds) {
    Map<UUID, Integer> result = new HashMap<>();
    if (eventIds == null || eventIds.isEmpty()) {
      return result;
    }

    List<Object[]> rows = jpaRepository.countPresentByEventIds(eventIds);
    for (Object[] row : rows) {
      UUID eventId = (UUID) row[0];
      Long count = (Long) row[1];
      result.put(eventId, count == null ? 0 : count.intValue());
    }
    return result;
  }
}

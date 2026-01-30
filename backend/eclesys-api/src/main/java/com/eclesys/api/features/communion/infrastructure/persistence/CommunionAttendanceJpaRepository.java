package com.eclesys.api.features.communion.infrastructure.persistence;

import com.eclesys.api.features.communion.domain.CommunionAttendance;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunionAttendanceJpaRepository extends JpaRepository<CommunionAttendance, UUID> {

  Optional<CommunionAttendance> findByEventIdAndMemberId(UUID eventId, UUID memberId);

  List<CommunionAttendance> findAllByEventId(UUID eventId);

  List<CommunionAttendance> findByEventIdAndMemberIdIn(UUID eventId, List<UUID> memberIds);

  @Query("SELECT a.eventId, COUNT(a) FROM CommunionAttendance a " +
         "WHERE a.eventId IN :eventIds AND a.present = true " +
         "GROUP BY a.eventId")
  List<Object[]> countPresentByEventIds(@Param("eventIds") List<UUID> eventIds);
}

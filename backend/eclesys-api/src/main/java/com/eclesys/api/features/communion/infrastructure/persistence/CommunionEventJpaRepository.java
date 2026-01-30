package com.eclesys.api.features.communion.infrastructure.persistence;

import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunionEventJpaRepository extends JpaRepository<CommunionEvent, UUID> {

  Optional<CommunionEvent> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<CommunionEvent> findByTenantIdAndCongregationIdAndEventDate(
      UUID tenantId,
      UUID congregationId,
      LocalDate eventDate
  );

  @Query("SELECT e FROM CommunionEvent e WHERE e.tenantId = :tenantId " +
         "AND e.status = COALESCE(:status, e.status) " +
         "AND e.eventDate >= COALESCE(:from, e.eventDate) " +
         "AND e.eventDate <= COALESCE(:to, e.eventDate) " +
         "ORDER BY e.eventDate DESC")
  List<CommunionEvent> searchAll(
      @Param("tenantId") UUID tenantId,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to,
      @Param("status") CommunionEventStatus status
  );

  @Query("SELECT e FROM CommunionEvent e WHERE e.tenantId = :tenantId " +
         "AND e.congregationId IN :congregationIds " +
         "AND e.status = COALESCE(:status, e.status) " +
         "AND e.eventDate >= COALESCE(:from, e.eventDate) " +
         "AND e.eventDate <= COALESCE(:to, e.eventDate) " +
         "ORDER BY e.eventDate DESC")
  List<CommunionEvent> searchByCongregations(
      @Param("tenantId") UUID tenantId,
      @Param("congregationIds") List<UUID> congregationIds,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to,
      @Param("status") CommunionEventStatus status
  );
}

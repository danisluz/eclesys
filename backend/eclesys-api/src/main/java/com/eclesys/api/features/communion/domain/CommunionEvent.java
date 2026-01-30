package com.eclesys.api.features.communion.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
    name = "communion_events",
    uniqueConstraints = @UniqueConstraint(columnNames = {"congregation_id", "event_date"})
)
public class CommunionEvent {

  @Id
  @Column(nullable = false)
  private UUID id;

  @Column(name = "tenant_id", nullable = false)
  private UUID tenantId;

  @Column(name = "congregation_id", nullable = false)
  private UUID congregationId;

  @Column(name = "event_date", nullable = false)
  private LocalDate eventDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private CommunionEventStatus status;

  @Column(name = "created_by_user_id", nullable = false)
  private UUID createdByUserId;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  public void open() {
    if (status != CommunionEventStatus.DRAFT) {
      throw new IllegalStateException("Evento só pode ser aberto quando estiver em rascunho");
    }
    status = CommunionEventStatus.OPEN;
  }

  public void close() {
    if (status != CommunionEventStatus.OPEN) {
      throw new IllegalStateException("Evento só pode ser fechado quando estiver aberto");
    }
    status = CommunionEventStatus.CLOSED;
  }

  @PrePersist
  public void prePersist() {
    LocalDateTime now = LocalDateTime.now();
    if (id == null) id = UUID.randomUUID();
    if (status == null) status = CommunionEventStatus.DRAFT;
    createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}

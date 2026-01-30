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
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
    name = "communion_attendance",
    uniqueConstraints = @UniqueConstraint(columnNames = {"communion_event_id", "member_id"})
)
public class CommunionAttendance {

  @Id
  @Column(nullable = false)
  private UUID id;

  @Column(name = "communion_event_id", nullable = false)
  private UUID eventId;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Column(nullable = false)
  private Boolean present;

  @Column(name = "recorded_by_user_id", nullable = false)
  private UUID recordedByUserId;

  @Column(name = "recorded_at", nullable = false)
  private LocalDateTime recordedAt;

  @Enumerated(EnumType.STRING)
  @Column(name = "source", nullable = false, length = 10)
  private AttendanceSource source;

  @PrePersist
  public void prePersist() {
    if (id == null) id = UUID.randomUUID();
    if (recordedAt == null) recordedAt = LocalDateTime.now();
    if (present == null) present = Boolean.TRUE;
  }

  @PreUpdate
  public void preUpdate() {
    if (recordedAt == null) {
      recordedAt = LocalDateTime.now();
    }
  }
}

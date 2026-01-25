package com.eclesys.api.domain.member;

import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.user.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "member_position_history")
public class MemberPositionHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tenant_id", nullable = false)
  private TenantEntity tenant;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member;

  @Column(name = "old_position", length = 50)
  private String oldPosition;

  @Column(name = "new_position", length = 50)
  private String newPosition;

  @Column(name = "reason", columnDefinition = "TEXT")
  private String reason;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "changed_by_user_id", nullable = false)
  private UserEntity changedBy;

  @Column(name = "changed_at", nullable = false)
  private LocalDateTime changedAt;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
    if (changedAt == null) {
      changedAt = LocalDateTime.now();
    }
  }
}

package com.eclesys.api.features.functionroles.entity;

import com.eclesys.api.features.tenants.entity.TenantEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "function_roles")
public class FunctionRole {

  @Id
  @Column(nullable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tenant_id", nullable = false)
  private TenantEntity tenant;

  @Column(nullable = false, length = 60)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(name = "scope_type", nullable = false, length = 20)
  private ScopeType scopeType;

  @Column(name = "max_holders")
  private Integer maxHolders;

  @Column(name = "sort_order", nullable = false)
  private Integer sortOrder;

  @Column(name = "is_active", nullable = false)
  private Boolean isActive;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  public void prePersist() {
    LocalDateTime now = LocalDateTime.now();
    if (id == null) id = UUID.randomUUID();
    createdAt = now;
    updatedAt = now;
    if (isActive == null) isActive = true;
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}

package com.eclesys.api.domain.tenant;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tenants")
public class TenantEntity {

  @Id
  @Column(nullable = false)
  private UUID id;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(name = "tenant_code", nullable = false, length = 60, unique = true)
  private String tenantCode;

  @Column(name = "logo_url", length = 500)
  private String logoUrl;

  @Column(name = "is_active", nullable = false)
  private boolean isActive;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @PrePersist
  public void prePersist() {
    Instant now = Instant.now();
    if (id == null) id = UUID.randomUUID();
    createdAt = now;
    updatedAt = now;
    if (!isActive) isActive = true;
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = Instant.now();
  }
}

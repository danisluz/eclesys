package com.eclesys.api.domain.user;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity {

  @Id
  @Column(nullable = false)
  private UUID id;

  @Column(name = "tenant_id", nullable = false)
  private UUID tenantId;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(nullable = false, length = 120)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserRole role;

  @Column(name = "is_active", nullable = false)
  private boolean isActive;

  // ===== GETTERS =====
  public UUID getId() {
    return id;
  }

  public UUID getTenantId() {
    return tenantId;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public UserRole getRole() {
    return role;
  }

  public boolean isActive() {
    return isActive;
  }

  // ===== SETTERS (usados no onboarding) =====
  public void setId(UUID id) {
    this.id = id;
  }

  public void setTenantId(UUID tenantId) {
    this.tenantId = tenantId;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public void setRole(UserRole role) {
    this.role = role;
  }

  public void setActive(boolean active) {
    isActive = active;
  }
}

package com.eclesys.api.domain.organization;

import com.eclesys.api.domain.tenant.TenantEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "organization_units")
public class OrganizationUnit {

  @Id
  @Column(nullable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tenant_id", nullable = false)
  private TenantEntity tenant;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OrganizationUnitType type;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(length = 60)
  private String code;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private OrganizationUnit parent;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OrganizationUnitStatus status = OrganizationUnitStatus.ACTIVE;

  @Column(name = "is_headquarters", nullable = false)
  private boolean isHeadquarters = false;

  @Column(name = "sector_label", length = 50)
  private String sectorLabel;

  @Column(name = "congregation_label", length = 50)
  private String congregationLabel;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  public void prePersist() {
    if (id == null) id = UUID.randomUUID();
    LocalDateTime now = LocalDateTime.now();
    createdAt = now;
    updatedAt = now;
    
    // CHURCH sempre é headquarters
    if (type == OrganizationUnitType.CHURCH) {
      isHeadquarters = true;
    }
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }

  // Getters e Setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public TenantEntity getTenant() {
    return tenant;
  }

  public void setTenant(TenantEntity tenant) {
    this.tenant = tenant;
  }

  public OrganizationUnitType getType() {
    return type;
  }

  public void setType(OrganizationUnitType type) {
    this.type = type;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public OrganizationUnit getParent() {
    return parent;
  }

  public void setParent(OrganizationUnit parent) {
    this.parent = parent;
  }

  public OrganizationUnitStatus getStatus() {
    return status;
  }

  public void setStatus(OrganizationUnitStatus status) {
    this.status = status;
  }

  public boolean isHeadquarters() {
    return isHeadquarters;
  }

  public void setHeadquarters(boolean headquarters) {
    isHeadquarters = headquarters;
  }

  public String getSectorLabel() {
    return sectorLabel;
  }

  public void setSectorLabel(String sectorLabel) {
    this.sectorLabel = sectorLabel;
  }

  public String getCongregationLabel() {
    return congregationLabel;
  }

  public void setCongregationLabel(String congregationLabel) {
    this.congregationLabel = congregationLabel;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}

package com.eclesys.api.domain.tenant;

import com.eclesys.api.domain.tenant.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_transfer_approval_settings")
public class TenantTransferApprovalSettings {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tenant_id", nullable = false, unique = true)
  private TenantEntity tenant;

  @Enumerated(EnumType.STRING)
  @Column(name = "internal_same_sector_approval", nullable = false)
  private ApprovalLevel internalSameSectorApproval;

  @Enumerated(EnumType.STRING)
  @Column(name = "internal_cross_sector_approval", nullable = false)
  private ApprovalLevel internalCrossSectorApproval;

  @Enumerated(EnumType.STRING)
  @Column(name = "external_approval", nullable = false)
  private ApprovalLevel externalApproval;

  @Column(name = "require_justification_on_rejection", nullable = false)
  private boolean requireJustificationOnRejection;

  @Column(name = "allow_requester_cancel", nullable = false)
  private boolean allowRequesterCancel;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Getters and Setters
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

  public ApprovalLevel getInternalSameSectorApproval() {
    return internalSameSectorApproval;
  }

  public void setInternalSameSectorApproval(ApprovalLevel internalSameSectorApproval) {
    this.internalSameSectorApproval = internalSameSectorApproval;
  }

  public ApprovalLevel getInternalCrossSectorApproval() {
    return internalCrossSectorApproval;
  }

  public void setInternalCrossSectorApproval(ApprovalLevel internalCrossSectorApproval) {
    this.internalCrossSectorApproval = internalCrossSectorApproval;
  }

  public ApprovalLevel getExternalApproval() {
    return externalApproval;
  }

  public void setExternalApproval(ApprovalLevel externalApproval) {
    this.externalApproval = externalApproval;
  }

  public boolean isRequireJustificationOnRejection() {
    return requireJustificationOnRejection;
  }

  public void setRequireJustificationOnRejection(boolean requireJustificationOnRejection) {
    this.requireJustificationOnRejection = requireJustificationOnRejection;
  }

  public boolean isAllowRequesterCancel() {
    return allowRequesterCancel;
  }

  public void setAllowRequesterCancel(boolean allowRequesterCancel) {
    this.allowRequesterCancel = allowRequesterCancel;
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

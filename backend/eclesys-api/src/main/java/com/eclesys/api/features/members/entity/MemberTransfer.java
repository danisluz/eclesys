package com.eclesys.api.features.members.entity;

import com.eclesys.api.features.organizations.entity.OrganizationUnit;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.users.entity.UserEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "members_transfers")
public class MemberTransfer {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tenant_id", nullable = false)
  private TenantEntity tenant;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private Member member;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "from_congregation_id")
  private OrganizationUnit fromCongregation;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "to_congregation_id")
  private OrganizationUnit toCongregation;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "transferred_by_user_id", nullable = false)
  private UserEntity transferredBy;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private TransferStatus status;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "requested_by_user_id", nullable = false)
  private UserEntity requestedBy;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "approved_by_user_id")
  private UserEntity approvedBy;

  @Column(name = "approved_at")
  private LocalDateTime approvedAt;

  @Column(name = "rejection_reason", columnDefinition = "TEXT")
  private String rejectionReason;

  @Column(columnDefinition = "TEXT")
  private String reason;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

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

  public Member getMember() {
    return member;
  }

  public void setMember(Member member) {
    this.member = member;
  }

  public OrganizationUnit getFromCongregation() {
    return fromCongregation;
  }

  public void setFromCongregation(OrganizationUnit fromCongregation) {
    this.fromCongregation = fromCongregation;
  }

  public OrganizationUnit getToCongregation() {
    return toCongregation;
  }

  public void setToCongregation(OrganizationUnit toCongregation) {
    this.toCongregation = toCongregation;
  }

  public UserEntity getTransferredBy() {
    return transferredBy;
  }

  public void setTransferredBy(UserEntity transferredBy) {
    this.transferredBy = transferredBy;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public TransferStatus getStatus() {
    return status;
  }

  public void setStatus(TransferStatus status) {
    this.status = status;
  }

  public UserEntity getRequestedBy() {
    return requestedBy;
  }

  public void setRequestedBy(UserEntity requestedBy) {
    this.requestedBy = requestedBy;
  }

  public UserEntity getApprovedBy() {
    return approvedBy;
  }

  public void setApprovedBy(UserEntity approvedBy) {
    this.approvedBy = approvedBy;
  }

  public LocalDateTime getApprovedAt() {
    return approvedAt;
  }

  public void setApprovedAt(LocalDateTime approvedAt) {
    this.approvedAt = approvedAt;
  }

  public String getRejectionReason() {
    return rejectionReason;
  }

  public void setRejectionReason(String rejectionReason) {
    this.rejectionReason = rejectionReason;
  }
}

package com.eclesys.api.domain.member;

import com.eclesys.api.domain.organization.OrganizationUnit;
import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.user.UserEntity;
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
}

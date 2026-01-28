package com.eclesys.api.features.users.entity;

import com.eclesys.api.features.organizations.entity.OrganizationUnit;
import com.eclesys.api.features.members.entity.Member;
import com.eclesys.api.features.functionroles.entity.FunctionRole;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "user_organization_roles",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "organization_unit_id", "role"})
)
public class UserOrganizationRole {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = true)
  private UserEntity user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = true)
  private Member member;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organization_unit_id", nullable = false)
  private OrganizationUnit organizationUnit;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "function_role_id", nullable = false)
  private FunctionRole functionRole;

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

  public UserEntity getUser() {
    return user;
  }

  public void setUser(UserEntity user) {
    this.user = user;
  }

  public Member getMember() {
    return member;
  }

  public void setMember(Member member) {
    this.member = member;
  }

  public OrganizationUnit getOrganizationUnit() {
    return organizationUnit;
  }

  public void setOrganizationUnit(OrganizationUnit organizationUnit) {
    this.organizationUnit = organizationUnit;
  }

  public FunctionRole getFunctionRole() {
    return functionRole;
  }

  public void setFunctionRole(FunctionRole functionRole) {
    this.functionRole = functionRole;
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

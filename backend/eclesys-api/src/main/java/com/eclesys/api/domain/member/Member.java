package com.eclesys.api.domain.member;

import com.eclesys.api.domain.churchrole.ChurchRole;
import com.eclesys.api.domain.organization.OrganizationUnit;
import com.eclesys.api.domain.tenant.TenantEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "members")
public class Member {

  @Id
  @Column(nullable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tenant_id", nullable = false)
  private TenantEntity tenant;

  @Column(name = "full_name", nullable = false, length = 180)
  private String fullName;

  @Column(length = 180)
  private String email;

  @Column(length = 20)
  private String phone;

  @Column(length = 20)
  private String document;

  @Column(name = "birth_date")
  private LocalDate birthDate;

  @Column(name = "baptism_date")
  private LocalDate baptismDate;

  @Column(name = "baptism_church")
  private String baptismChurch;

  @Column(name = "baptism_location")
  private String baptismLocation;

  @Enumerated(EnumType.STRING)
  @Column(length = 1)
  private Gender gender;

  @Enumerated(EnumType.STRING)
  @Column(name = "marital_status", length = 20)
  private MaritalStatus maritalStatus;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private Map<String, Object> address;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private MemberStatus status;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organization_unit_id")
  private OrganizationUnit organizationUnit;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "church_role_id")
  private ChurchRole churchRole;

  // Relacionamentos familiares
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "spouse_id")
  private Member spouse;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "father_id")
  private Member father;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "mother_id")
  private Member mother;

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
    if (status == null) status = MemberStatus.ACTIVE;
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}

package com.eclesys.api.features.members.repository;

import com.eclesys.api.features.dashboard.dto.DashboardStatsDTO;
import com.eclesys.api.features.members.entity.Gender;
import com.eclesys.api.features.members.entity.Member;
import com.eclesys.api.features.members.entity.MemberStatus;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<Member, UUID> {

  List<Member> findAllByTenantOrderByFullNameAsc(TenantEntity tenant);

  List<Member> findAllByTenantAndStatusOrderByFullNameAsc(TenantEntity tenant, MemberStatus status);

  Optional<Member> findByTenantAndId(TenantEntity tenant, UUID id);

  @Query("SELECT m FROM Member m WHERE m.tenant = :tenant AND " +
         "(LOWER(m.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
         "LOWER(m.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
         "LOWER(m.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
         "ORDER BY m.fullName ASC")
  List<Member> searchByTenant(@Param("tenant") TenantEntity tenant, @Param("search") String search);

  long countByTenantAndStatus(TenantEntity tenant, MemberStatus status);

  long countByTenant(TenantEntity tenant);

  @Query("SELECT COUNT(m) FROM Member m WHERE m.tenant = :tenant AND m.createdAt >= :date")
  long countByTenantAndCreatedAtAfter(@Param("tenant") TenantEntity tenant, @Param("date") java.time.LocalDateTime date);

  /**
   * Verifica se já existe um membro com o CPF informado no tenant
   */
  boolean existsByTenantAndDocument(TenantEntity tenant, String document);

  // Paginação
  Page<Member> findAllByTenant(TenantEntity tenant, Pageable pageable);

  @Query("SELECT m FROM Member m WHERE m.tenant = :tenant " +
         "AND (:status IS NULL OR m.status = :status) " +
         "AND (:organizationUnitIds IS NULL OR m.organizationUnit.id IN :organizationUnitIds) " +
         "AND (:churchRoleId IS NULL OR m.churchRole.id = :churchRoleId)")
  Page<Member> findAllByTenantWithFilters(
      @Param("tenant") TenantEntity tenant,
      @Param("status") MemberStatus status,
      @Param("organizationUnitIds") List<UUID> organizationUnitIds,
      @Param("churchRoleId") UUID churchRoleId,
      Pageable pageable
  );

  @Query("SELECT m FROM Member m WHERE m.tenant = :tenant AND " +
         "(LOWER(m.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
         "LOWER(m.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
         "LOWER(m.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
         "AND (:status IS NULL OR m.status = :status) " +
         "AND (:organizationUnitIds IS NULL OR m.organizationUnit.id IN :organizationUnitIds) " +
         "AND (:churchRoleId IS NULL OR m.churchRole.id = :churchRoleId)")
  Page<Member> searchByTenantWithFilters(
      @Param("tenant") TenantEntity tenant,
      @Param("search") String search,
      @Param("status") MemberStatus status,
      @Param("organizationUnitIds") List<UUID> organizationUnitIds,
      @Param("churchRoleId") UUID churchRoleId,
      Pageable pageable
  );
  
  // Dashboard queries
  long countByTenantAndGender(TenantEntity tenant, Gender gender);
  
  @Query("SELECT new com.eclesys.api.features.dashboard.dto.DashboardStatsDTO$OrganizationMemberCount(o.name, COUNT(m)) " +
         "FROM Member m JOIN m.organizationUnit o " +
         "WHERE m.tenant = :tenant " +
         "GROUP BY o.id, o.name " +
         "ORDER BY COUNT(m) DESC")
  List<DashboardStatsDTO.OrganizationMemberCount> countMembersByOrganization(@Param("tenant") TenantEntity tenant, Pageable pageable);
}

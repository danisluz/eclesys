package com.eclesys.api.domain.member;

import com.eclesys.api.domain.tenant.TenantEntity;
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
}

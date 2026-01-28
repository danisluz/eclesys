package com.eclesys.api.features.users.repository;

import com.eclesys.api.features.users.entity.UserOrganizationRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOrganizationRoleRepository extends JpaRepository<UserOrganizationRole, UUID> {
  List<UserOrganizationRole> findByUserId(UUID userId);
  List<UserOrganizationRole> findByMemberId(UUID memberId);
  
  @Query("SELECT r FROM UserOrganizationRole r " +
         "LEFT JOIN FETCH r.user " +
         "LEFT JOIN FETCH r.member " +
         "LEFT JOIN FETCH r.organizationUnit " +
         "LEFT JOIN FETCH r.functionRole " +
         "WHERE r.organizationUnit.id = :organizationUnitId")
  List<UserOrganizationRole> findByOrganizationUnitIdWithDetails(@Param("organizationUnitId") UUID organizationUnitId);
  
  List<UserOrganizationRole> findByOrganizationUnitId(UUID organizationUnitId);
  List<UserOrganizationRole> findByUserIdAndOrganizationUnitId(UUID userId, UUID organizationUnitId);
  List<UserOrganizationRole> findByMemberIdAndOrganizationUnitId(UUID memberId, UUID organizationUnitId);
  List<UserOrganizationRole> findByUserIdAndFunctionRoleId(UUID userId, UUID functionRoleId);
  Optional<UserOrganizationRole> findByUserIdAndOrganizationUnitIdAndFunctionRoleId(UUID userId, UUID organizationUnitId, UUID functionRoleId);
  Optional<UserOrganizationRole> findByMemberIdAndOrganizationUnitIdAndFunctionRoleId(UUID memberId, UUID organizationUnitId, UUID functionRoleId);
}

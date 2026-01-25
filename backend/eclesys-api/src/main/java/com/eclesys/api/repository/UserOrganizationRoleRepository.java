package com.eclesys.api.repository;

import com.eclesys.api.domain.user.OrganizationRole;
import com.eclesys.api.domain.user.UserOrganizationRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOrganizationRoleRepository extends JpaRepository<UserOrganizationRole, UUID> {
  List<UserOrganizationRole> findByUserId(UUID userId);
  List<UserOrganizationRole> findByOrganizationUnitId(UUID organizationUnitId);
  List<UserOrganizationRole> findByUserIdAndOrganizationUnitId(UUID userId, UUID organizationUnitId);
  List<UserOrganizationRole> findByUserIdAndRole(UUID userId, OrganizationRole role);
  Optional<UserOrganizationRole> findByUserIdAndOrganizationUnitIdAndRole(UUID userId, UUID organizationUnitId, OrganizationRole role);
}

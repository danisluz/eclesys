package com.eclesys.api.features.communion.application;

import com.eclesys.api.features.communion.application.port.CongregationAccessPort;
import com.eclesys.api.features.communion.application.port.CongregationInfo;
import com.eclesys.api.features.communion.application.port.OrganizationRoleInfo;
import com.eclesys.api.features.communion.application.port.OrganizationRoleQueryPort;
import com.eclesys.api.features.communion.application.port.OrganizationUnitScopeType;
import com.eclesys.api.features.users.entity.UserRole;
import com.eclesys.api.shared.api.ForbiddenException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CommunionAccessService {

  private final OrganizationRoleQueryPort organizationRoleQueryPort;
  private final CongregationAccessPort congregationAccessPort;

  public CommunionAccessService(
      OrganizationRoleQueryPort organizationRoleQueryPort,
      CongregationAccessPort congregationAccessPort
  ) {
    this.organizationRoleQueryPort = organizationRoleQueryPort;
    this.congregationAccessPort = congregationAccessPort;
  }

  public void assertCanManageEvent(UUID tenantId, UUID userId, UserRole role, UUID congregationId) {
    if (isAdmin(role)) return;

    CongregationInfo congregation = getCongregationOrThrow(tenantId, congregationId);
    List<OrganizationRoleInfo> roles = organizationRoleQueryPort.listRolesByUser(userId);

    if (hasChurchSecretariat(roles)) return;
    if (hasCongregationSecretariat(roles, congregation.id())) return;

    throw new ForbiddenException("forbidden");
  }

  public void assertCanViewOrRecord(UUID tenantId, UUID userId, UserRole role, UUID congregationId) {
    if (isAdmin(role)) return;

    CongregationInfo congregation = getCongregationOrThrow(tenantId, congregationId);
    List<OrganizationRoleInfo> roles = organizationRoleQueryPort.listRolesByUser(userId);

    if (hasChurchSecretariat(roles)) return;
    if (hasCongregationSecretariat(roles, congregation.id())) return;
    if (hasSectorSecretariatForCongregation(roles, congregation)) return;

    throw new ForbiddenException("forbidden");
  }

  public List<UUID> listAccessibleCongregations(UUID tenantId, UUID userId, UserRole role) {
    if (isAdmin(role)) return null;

    List<OrganizationRoleInfo> roles = organizationRoleQueryPort.listRolesByUser(userId);

    if (hasChurchSecretariat(roles)) return null;

    Set<UUID> congregationIds = new HashSet<>();

    for (OrganizationRoleInfo roleInfo : roles) {
      if (!isSecretariatRole(roleInfo)) {
        continue;
      }
      if (roleInfo.unitType() == OrganizationUnitScopeType.CONGREGATION) {
        congregationIds.add(roleInfo.organizationUnitId());
      }
      if (roleInfo.unitType() == OrganizationUnitScopeType.SECTOR) {
        List<UUID> sectorCongregations = congregationAccessPort
            .listCongregationsBySector(tenantId, roleInfo.organizationUnitId());
        congregationIds.addAll(sectorCongregations);
      }
    }

    if (congregationIds.isEmpty()) {
      throw new ForbiddenException("forbidden");
    }

    return new ArrayList<>(congregationIds);
  }

  private CongregationInfo getCongregationOrThrow(UUID tenantId, UUID congregationId) {
    CongregationInfo congregation = congregationAccessPort.getCongregation(tenantId, congregationId);
    if (congregation.type() != OrganizationUnitScopeType.CONGREGATION) {
      throw new IllegalArgumentException("Unidade informada não é uma congregação");
    }
    return congregation;
  }

  private boolean isAdmin(UserRole role) {
    return role == UserRole.ADMIN;
  }

  private boolean hasChurchSecretariat(List<OrganizationRoleInfo> roles) {
    for (OrganizationRoleInfo roleInfo : roles) {
      if (isSecretariatRole(roleInfo) && roleInfo.unitType() == OrganizationUnitScopeType.CHURCH) {
        return true;
      }
    }
    return false;
  }

  private boolean hasCongregationSecretariat(List<OrganizationRoleInfo> roles, UUID congregationId) {
    for (OrganizationRoleInfo roleInfo : roles) {
      if (isSecretariatRole(roleInfo)
          && roleInfo.unitType() == OrganizationUnitScopeType.CONGREGATION
          && roleInfo.organizationUnitId().equals(congregationId)) {
        return true;
      }
    }
    return false;
  }

  private boolean hasSectorSecretariatForCongregation(List<OrganizationRoleInfo> roles, CongregationInfo congregation) {
    if (congregation.parentId() == null) return false;

    for (OrganizationRoleInfo roleInfo : roles) {
      if (isSecretariatRole(roleInfo)
          && roleInfo.unitType() == OrganizationUnitScopeType.SECTOR
          && roleInfo.organizationUnitId().equals(congregation.parentId())) {
        return true;
      }
    }
    return false;
  }

  private boolean isSecretariatRole(OrganizationRoleInfo roleInfo) {
    if (roleInfo.roleKey() == null || roleInfo.roleKey().isBlank()) {
      return false;
    }
    return roleInfo.roleKey().startsWith("SECRETAR");
  }
}

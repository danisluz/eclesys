package com.eclesys.api.features.communion.infrastructure.adapter;

import com.eclesys.api.features.communion.application.port.OrganizationRoleInfo;
import com.eclesys.api.features.communion.application.port.OrganizationRoleQueryPort;
import com.eclesys.api.features.communion.application.port.OrganizationUnitScopeType;
import com.eclesys.api.features.organizations.entity.OrganizationUnitType;
import com.eclesys.api.features.users.entity.UserOrganizationRole;
import com.eclesys.api.features.users.repository.UserOrganizationRoleRepository;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class OrganizationRoleQueryAdapter implements OrganizationRoleQueryPort {

  private final UserOrganizationRoleRepository roleRepository;

  public OrganizationRoleQueryAdapter(UserOrganizationRoleRepository roleRepository) {
    this.roleRepository = roleRepository;
  }

  @Override
  public List<OrganizationRoleInfo> listRolesByUser(UUID userId) {
    return roleRepository.findByUserId(userId).stream()
        .map(this::toRoleInfo)
        .toList();
  }

  private OrganizationRoleInfo toRoleInfo(UserOrganizationRole role) {
    String roleName = role.getFunctionRole() != null ? role.getFunctionRole().getName() : null;
    return new OrganizationRoleInfo(
        role.getOrganizationUnit().getId(),
        toScopeType(role.getOrganizationUnit().getType()),
        normalizeRoleKey(roleName)
    );
  }

  private OrganizationUnitScopeType toScopeType(OrganizationUnitType type) {
    return switch (type) {
      case CHURCH -> OrganizationUnitScopeType.CHURCH;
      case SECTOR -> OrganizationUnitScopeType.SECTOR;
      case CONGREGATION -> OrganizationUnitScopeType.CONGREGATION;
    };
  }

  private String normalizeRoleKey(String roleName) {
    if (roleName == null || roleName.isBlank()) return null;
    String normalized = Normalizer.normalize(roleName, Normalizer.Form.NFD);
    normalized = normalized.replaceAll("\\p{M}", "");
    normalized = normalized.toUpperCase(Locale.ROOT);
    normalized = normalized.replaceAll("[^A-Z0-9]+", "_");
    normalized = normalized.replaceAll("^_+|_+$", "");
    return normalized;
  }
}

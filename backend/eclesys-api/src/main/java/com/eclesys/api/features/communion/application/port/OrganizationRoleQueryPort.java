package com.eclesys.api.features.communion.application.port;

import java.util.List;
import java.util.UUID;

public interface OrganizationRoleQueryPort {
  List<OrganizationRoleInfo> listRolesByUser(UUID userId);
}

package com.eclesys.api.features.communion.application.port;

import java.util.UUID;

public record OrganizationRoleInfo(
    UUID organizationUnitId,
    OrganizationUnitScopeType unitType,
    String roleKey
) {}

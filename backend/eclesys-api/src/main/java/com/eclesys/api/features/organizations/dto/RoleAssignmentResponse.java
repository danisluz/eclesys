package com.eclesys.api.features.organizations.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record RoleAssignmentResponse(
    UUID id,
    UUID userId,
    String userName,
    UUID organizationUnitId,
    String organizationUnitName,
    UUID functionRoleId,
    String functionRoleName,
    LocalDateTime createdAt
) {}

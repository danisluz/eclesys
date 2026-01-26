package com.eclesys.api.features.organizations.dto;

import java.util.UUID;

public record AssignRoleRequest(
    UUID userId,
    UUID functionRoleId
) {}

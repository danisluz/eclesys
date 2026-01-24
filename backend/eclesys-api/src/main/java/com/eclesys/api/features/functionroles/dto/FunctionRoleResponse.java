package com.eclesys.api.features.functionroles.dto;

import com.eclesys.api.domain.functionrole.ScopeType;

import java.time.LocalDateTime;
import java.util.UUID;

public record FunctionRoleResponse(
    UUID id,
    String name,
    ScopeType scopeType,
    Integer maxHolders,
    Integer sortOrder,
    Boolean isActive,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

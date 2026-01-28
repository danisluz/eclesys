package com.eclesys.api.features.functionroles.dto;

import com.eclesys.api.features.functionroles.entity.ScopeType;

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

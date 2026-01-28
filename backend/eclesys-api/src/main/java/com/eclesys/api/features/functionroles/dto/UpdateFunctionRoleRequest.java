package com.eclesys.api.features.functionroles.dto;

import com.eclesys.api.features.functionroles.entity.ScopeType;
import jakarta.validation.constraints.Size;

public record UpdateFunctionRoleRequest(
    @Size(max = 60, message = "Nome não pode ter mais de 60 caracteres")
    String name,

    ScopeType scopeType,

    Integer maxHolders,

    Integer sortOrder,

    Boolean isActive
) {}

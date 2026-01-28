package com.eclesys.api.features.functionroles.dto;

import com.eclesys.api.features.functionroles.entity.ScopeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFunctionRoleRequest(
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 60, message = "Nome não pode ter mais de 60 caracteres")
    String name,

    @NotNull(message = "Tipo de escopo é obrigatório")
    ScopeType scopeType,

    Integer maxHolders,

    @NotNull(message = "Ordem de exibição é obrigatória")
    Integer sortOrder,

    Boolean isActive
) {}

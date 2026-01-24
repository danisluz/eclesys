package com.eclesys.api.features.churchroles.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateChurchRoleRequest(
    @NotBlank @Size(max = 60) String name,
    @NotNull Integer sortOrder,
    Boolean isActive
) {}

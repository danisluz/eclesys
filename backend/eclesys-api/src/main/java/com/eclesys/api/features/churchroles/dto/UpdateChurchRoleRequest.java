package com.eclesys.api.features.churchroles.dto;

import jakarta.validation.constraints.Size;

public record UpdateChurchRoleRequest(
    @Size(max = 60) String name,
    Integer sortOrder,
    Boolean isActive
) {}

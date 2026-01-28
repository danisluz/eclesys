package com.eclesys.api.features.organizations.dto;

import com.eclesys.api.features.organizations.entity.OrganizationUnitStatus;
import jakarta.validation.constraints.Size;

public record UpdateOrganizationUnitRequest(
    @Size(max = 120) String name,
    @Size(max = 60) String code,
    OrganizationUnitStatus status
) {}

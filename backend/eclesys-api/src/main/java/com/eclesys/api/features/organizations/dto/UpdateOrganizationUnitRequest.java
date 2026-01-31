package com.eclesys.api.features.organizations.dto;

import com.eclesys.api.features.organizations.entity.OrganizationUnitStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateOrganizationUnitRequest(
    @Size(max = 120) String name,
    @Size(max = 60) String code,
    OrganizationUnitStatus status,
    @Email @Size(max = 160) String contactEmail,
    @Size(max = 40) String contactPhone,
    @Size(max = 200) String website,
    @Size(max = 255) String address
) {}

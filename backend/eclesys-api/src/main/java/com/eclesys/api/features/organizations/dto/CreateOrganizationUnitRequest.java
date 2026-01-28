package com.eclesys.api.features.organizations.dto;

import com.eclesys.api.features.organizations.entity.OrganizationUnitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateOrganizationUnitRequest(
    @NotNull OrganizationUnitType type,
    @NotBlank @Size(max = 120) String name,
    @Size(max = 60) String code,
    UUID parentId,
    Boolean isHeadquarters,
    @Size(max = 50) String sectorLabel,
    @Size(max = 50) String congregationLabel
) {}

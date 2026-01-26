package com.eclesys.api.features.organizations.dto;

import com.eclesys.api.domain.organization.OrganizationUnitStatus;
import com.eclesys.api.domain.organization.OrganizationUnitType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrganizationUnitResponse(
    UUID id,
    OrganizationUnitType type,
    String name,
    String code,
    UUID parentId,
    String parentName,
    OrganizationUnitStatus status,
    boolean isHeadquarters,
    String sectorLabel,
    String congregationLabel,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<OrganizationUnitResponse> children,
    String leaderName,        // Nome do líder principal
    Integer assignmentsCount  // Quantidade de cargos preenchidos
) {}

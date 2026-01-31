package com.eclesys.api.features.organizations.dto;

import com.eclesys.api.features.organizations.entity.OrganizationUnitStatus;
import com.eclesys.api.features.organizations.entity.OrganizationUnitType;

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
    String contactEmail,
    String contactPhone,
    String website,
    String address,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<OrganizationUnitResponse> children,
    String leaderName,        // Nome do líder principal
    Integer assignmentsCount  // Quantidade de cargos preenchidos
) {}

package com.eclesys.api.features.churchroles.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChurchRoleResponse(
    UUID id,
    String name,
    Integer sortOrder,
    Boolean isActive,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

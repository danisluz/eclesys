package com.eclesys.api.features.me.dto;

import java.util.UUID;

public record MeResponse(
    UUID userId,
    String name,
    String email,
    String role,
    UUID tenantId,
    String tenantCode,
    String tenantName
) {}

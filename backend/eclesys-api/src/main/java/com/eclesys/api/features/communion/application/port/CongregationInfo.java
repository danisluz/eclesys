package com.eclesys.api.features.communion.application.port;

import java.util.UUID;

public record CongregationInfo(
    UUID id,
    OrganizationUnitScopeType type,
    UUID parentId
) {}

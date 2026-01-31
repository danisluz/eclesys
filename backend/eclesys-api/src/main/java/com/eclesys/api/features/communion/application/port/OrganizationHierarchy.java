package com.eclesys.api.features.communion.application.port;

public record OrganizationHierarchy(
    ChurchInfo church,
    OrganizationUnitSummary sector,
    OrganizationUnitSummary congregation
) {}

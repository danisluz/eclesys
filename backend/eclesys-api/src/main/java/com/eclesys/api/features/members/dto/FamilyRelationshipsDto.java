package com.eclesys.api.features.members.dto;

import java.util.UUID;

public record FamilyRelationshipsDto(
    UUID spouseId,
    String spouseName,
    UUID fatherId,
    String fatherName,
    UUID motherId,
    String motherName
) {}

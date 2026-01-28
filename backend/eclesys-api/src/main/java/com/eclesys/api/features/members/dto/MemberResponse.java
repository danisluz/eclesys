package com.eclesys.api.features.members.dto;

import com.eclesys.api.features.members.entity.Gender;
import com.eclesys.api.features.members.entity.MaritalStatus;
import com.eclesys.api.features.members.entity.MemberStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record MemberResponse(
    UUID id,
    String fullName,
    String email,
    String phone,
    String document,
    Integer registrationNumber,
    LocalDate birthDate,
    LocalDate baptismDate,
    String baptismChurch,
    String baptismLocation,
    Gender gender,
    MaritalStatus maritalStatus,
    AddressDto address,
    MemberStatus status,
    UUID organizationUnitId,
    String organizationUnitName,
    UUID churchRoleId,
    String churchRoleName,
    FamilyRelationshipsDto family,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

package com.eclesys.api.features.members.dto;

import com.eclesys.api.domain.member.Gender;
import com.eclesys.api.domain.member.MaritalStatus;
import com.eclesys.api.domain.member.MemberStatus;

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
    LocalDate birthDate,
    LocalDate baptismDate,
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

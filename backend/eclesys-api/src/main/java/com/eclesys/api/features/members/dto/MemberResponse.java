package com.eclesys.api.features.members.dto;

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
    Map<String, Object> address,
    MemberStatus status,
    UUID churchRoleId,
    String churchRoleName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

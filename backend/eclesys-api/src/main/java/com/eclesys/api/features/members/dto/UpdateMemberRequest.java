package com.eclesys.api.features.members.dto;

import com.eclesys.api.domain.member.Gender;
import com.eclesys.api.domain.member.MaritalStatus;
import com.eclesys.api.domain.member.MemberStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public record UpdateMemberRequest(
    @Size(max = 180, message = "Nome não pode ter mais de 180 caracteres")
    String fullName,

    @Email(message = "Email inválido")
    @Size(max = 180)
    String email,

    @Size(max = 20)
    String phone,

    @Size(max = 20)
    String document,

    LocalDate birthDate,

    LocalDate baptismDate,

    Gender gender,

    MaritalStatus maritalStatus,

    AddressDto address,

    MemberStatus status,

    UUID organizationUnitId,

    UUID churchRoleId,

    UUID spouseId,

    UUID fatherId,

    UUID motherId
) {}

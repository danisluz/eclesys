package com.eclesys.api.features.members.dto;

import com.eclesys.api.domain.member.MemberStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public record CreateMemberRequest(
    @NotBlank(message = "Nome completo é obrigatório")
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

    Map<String, Object> address,

    UUID churchRoleId
) {}

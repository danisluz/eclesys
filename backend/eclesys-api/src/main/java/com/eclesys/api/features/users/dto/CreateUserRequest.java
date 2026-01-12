package com.eclesys.api.features.users.dto;

import com.eclesys.api.domain.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @Size(min = 6) @NotBlank String password,
    @NotNull UserRole role
) {}

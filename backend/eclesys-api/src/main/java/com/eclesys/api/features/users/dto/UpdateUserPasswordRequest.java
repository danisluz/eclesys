package com.eclesys.api.features.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserPasswordRequest(
    @Size(min = 6) @NotBlank String newPassword
) {}

package com.eclesys.api.features.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateMyProfileRequest(
    @NotBlank
    @Size(min = 3, max = 120)
    String name
) {}

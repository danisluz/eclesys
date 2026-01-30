package com.eclesys.api.features.communion.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MarkAttendanceByRegistrationRequest(
    @NotBlank
    @Pattern(regexp = "\\d+", message = "Matrícula deve conter apenas números")
    String registrationNumber
) {}

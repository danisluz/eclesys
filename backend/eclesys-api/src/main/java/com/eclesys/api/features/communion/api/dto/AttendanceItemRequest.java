package com.eclesys.api.features.communion.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AttendanceItemRequest(
    @NotNull UUID memberId,
    @NotNull Boolean present
) {}

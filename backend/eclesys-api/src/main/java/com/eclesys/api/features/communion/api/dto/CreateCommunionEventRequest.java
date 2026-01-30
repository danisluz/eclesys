package com.eclesys.api.features.communion.api.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCommunionEventRequest(
    @NotNull UUID congregationId,
    @NotNull LocalDate eventDate
) {}

package com.eclesys.api.features.communion.api.dto;

import com.eclesys.api.features.communion.domain.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record AttendanceItemRequest(
    @NotNull UUID memberId,
    Boolean present,
    AttendanceStatus status,
    @Size(max = 500) String note
) {}

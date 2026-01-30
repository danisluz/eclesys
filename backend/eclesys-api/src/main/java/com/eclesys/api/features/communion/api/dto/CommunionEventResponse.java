package com.eclesys.api.features.communion.api.dto;

import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import java.time.LocalDate;
import java.util.UUID;

public record CommunionEventResponse(
    UUID id,
    UUID congregationId,
    LocalDate eventDate,
    CommunionEventStatus status,
    Integer totalMembers,
    Integer presentCount,
    Integer attendancePercent
) {}

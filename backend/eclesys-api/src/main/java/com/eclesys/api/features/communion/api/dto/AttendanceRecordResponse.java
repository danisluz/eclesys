package com.eclesys.api.features.communion.api.dto;

import java.util.UUID;

public record AttendanceRecordResponse(
    UUID eventId,
    UUID memberId,
    boolean present
) {}

package com.eclesys.api.features.communion.api.dto;

import com.eclesys.api.features.communion.domain.AttendanceStatus;
import java.util.UUID;

public record AttendanceRecordResponse(
    UUID eventId,
    UUID memberId,
    boolean present,
    AttendanceStatus status,
    String note
) {}

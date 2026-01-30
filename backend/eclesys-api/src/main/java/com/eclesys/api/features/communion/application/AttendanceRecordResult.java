package com.eclesys.api.features.communion.application;

import com.eclesys.api.features.communion.domain.AttendanceStatus;
import java.util.UUID;

public record AttendanceRecordResult(
    UUID eventId,
    UUID memberId,
    boolean present,
    AttendanceStatus status,
    String note
) {}

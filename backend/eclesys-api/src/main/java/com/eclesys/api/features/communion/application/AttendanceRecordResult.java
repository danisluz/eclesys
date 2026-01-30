package com.eclesys.api.features.communion.application;

import java.util.UUID;

public record AttendanceRecordResult(
    UUID eventId,
    UUID memberId,
    boolean present
) {}

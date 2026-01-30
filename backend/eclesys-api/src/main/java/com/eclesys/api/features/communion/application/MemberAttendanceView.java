package com.eclesys.api.features.communion.application;

import com.eclesys.api.features.communion.domain.AttendanceStatus;
import java.util.UUID;

public record MemberAttendanceView(
    UUID memberId,
    String fullName,
    String registrationNumber,
    boolean present,
    AttendanceStatus status,
    String note
) {}

package com.eclesys.api.features.communion.api.dto;

import com.eclesys.api.features.communion.domain.AttendanceStatus;
import java.util.UUID;

public record CommunionMemberAttendanceResponse(
    UUID memberId,
    String fullName,
    String registrationNumber,
    boolean present,
    AttendanceStatus status,
    String note
) {}

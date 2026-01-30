package com.eclesys.api.features.communion.api.dto;

import java.util.UUID;

public record CommunionMemberAttendanceResponse(
    UUID memberId,
    String fullName,
    String registrationNumber,
    boolean present
) {}

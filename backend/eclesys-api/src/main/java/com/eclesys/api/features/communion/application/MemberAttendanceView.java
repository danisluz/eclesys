package com.eclesys.api.features.communion.application;

import java.util.UUID;

public record MemberAttendanceView(
    UUID memberId,
    String fullName,
    String registrationNumber,
    boolean present
) {}

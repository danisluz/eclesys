package com.eclesys.api.features.communion.application;

import java.util.UUID;

public record AttendanceUpdateItem(
    UUID memberId,
    boolean present
) {}

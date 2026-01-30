package com.eclesys.api.features.communion.application;

import com.eclesys.api.features.communion.domain.CommunionEvent;

public record CommunionEventSummary(
    CommunionEvent event,
    Integer totalMembers,
    Integer presentCount,
    Integer attendancePercent
) {}

package com.eclesys.api.features.communion.api.dto;

import java.util.List;

public record CommunionEventDetailResponse(
    CommunionEventResponse event,
    List<CommunionMemberAttendanceResponse> members
) {}

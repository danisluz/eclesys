package com.eclesys.api.features.communion.api.dto;

import java.util.List;

public record CommunionBlankListResponse(
    CommunionEventResponse event,
    List<CommunionMemberSummaryResponse> members
) {}

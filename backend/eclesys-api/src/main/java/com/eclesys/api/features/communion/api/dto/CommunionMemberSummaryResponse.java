package com.eclesys.api.features.communion.api.dto;

import java.util.UUID;

public record CommunionMemberSummaryResponse(
    UUID memberId,
    String fullName,
    String registrationNumber
) {}

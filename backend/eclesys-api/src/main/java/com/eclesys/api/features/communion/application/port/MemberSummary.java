package com.eclesys.api.features.communion.application.port;

import java.util.UUID;

public record MemberSummary(
    UUID id,
    String fullName,
    String registrationNumber
) {}

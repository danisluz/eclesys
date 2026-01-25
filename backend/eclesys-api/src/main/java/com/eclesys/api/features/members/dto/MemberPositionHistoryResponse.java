package com.eclesys.api.features.members.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MemberPositionHistoryResponse(
    UUID id,
    String oldPositionName,
    String newPositionName,
    String reason,
    String changedByUserName,
    LocalDateTime changedAt
) {
}

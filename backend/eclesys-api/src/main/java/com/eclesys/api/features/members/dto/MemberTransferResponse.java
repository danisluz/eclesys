package com.eclesys.api.features.members.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MemberTransferResponse(
    UUID id,
    UUID memberId,
    String memberName,
    UUID fromCongregationId,
    String fromCongregationName,
    UUID toCongregationId,
    String toCongregationName,
    String reason,
    String transferredByUserName,
    LocalDateTime createdAt,
    String status,
    String requestedByUserName,
    String approvedByUserName,
    LocalDateTime approvedAt,
    String rejectionReason
) {
}

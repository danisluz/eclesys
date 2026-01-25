package com.eclesys.api.features.members.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record TransferMemberRequest(
    UUID toCongregationId, // null = transferência externa
    @NotBlank String reason,
    String externalDestination // usado quando toCongregationId é null
) {
}

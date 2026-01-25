package com.eclesys.api.features.members.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Resposta genérica para histórico do membro
 * Pode representar tanto uma mudança de cargo quanto uma transferência
 */
public record MemberHistoryResponse(
    UUID id,
    String type, // "POSITION_CHANGE" ou "TRANSFER"
    String description,
    String fromValue,
    String toValue,
    String reason,
    String performedBy,
    LocalDateTime performedAt,
    String status // Para transferências: PENDING, APPROVED, REJECTED, CANCELLED
) {
}

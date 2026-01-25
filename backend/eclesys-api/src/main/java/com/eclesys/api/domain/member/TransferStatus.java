package com.eclesys.api.domain.member;

public enum TransferStatus {
  PENDING,    // Aguardando aprovação
  APPROVED,   // Aprovada e executada
  REJECTED,   // Rejeitada
  CANCELLED   // Cancelada pelo solicitante
}

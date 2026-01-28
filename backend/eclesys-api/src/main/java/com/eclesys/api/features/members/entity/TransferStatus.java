package com.eclesys.api.features.members.entity;

public enum TransferStatus {
  PENDING,    // Aguardando aprovação
  APPROVED,   // Aprovada e executada
  REJECTED,   // Rejeitada
  CANCELLED   // Cancelada pelo solicitante
}

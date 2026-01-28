package com.eclesys.api.features.tenants.entity;

public enum ApprovalLevel {
  AUTO,                      // Sem aprovação (executa automaticamente)
  SECRETARY_CONGREGATION,    // Secretário da congregação
  SECRETARY_SECTOR,          // Secretário do setor
  SECRETARY_CHURCH,          // Secretário geral da igreja
  ADMIN                      // Apenas administrador
}

package com.eclesys.api.features.communion.application.port;

import java.util.List;
import java.util.UUID;

public interface CongregationAccessPort {
  CongregationInfo getCongregation(UUID tenantId, UUID congregationId);

  List<UUID> listCongregationsBySector(UUID tenantId, UUID sectorId);
}

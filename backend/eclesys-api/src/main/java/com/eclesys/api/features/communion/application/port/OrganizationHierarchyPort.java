package com.eclesys.api.features.communion.application.port;

import java.util.UUID;

public interface OrganizationHierarchyPort {
  OrganizationHierarchy getHierarchyByCongregation(UUID tenantId, UUID congregationId);
}

package com.eclesys.api.features.churchroles;

import com.eclesys.api.domain.churchrole.ChurchRole;
import com.eclesys.api.domain.churchrole.ChurchRoleRepository;
import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.tenant.TenantRepository;
import com.eclesys.api.features.churchroles.dto.ChurchRoleResponse;
import com.eclesys.api.features.churchroles.dto.CreateChurchRoleRequest;
import com.eclesys.api.features.churchroles.dto.UpdateChurchRoleRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChurchRoleService {

  private final ChurchRoleRepository repository;
  private final TenantRepository tenantRepository;

  public ChurchRoleService(
      ChurchRoleRepository repository,
      TenantRepository tenantRepository
  ) {
    this.repository = repository;
    this.tenantRepository = tenantRepository;
  }

  @Transactional
  public ChurchRoleResponse create(UUID tenantId, CreateChurchRoleRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    // Validar nome duplicado
    if (repository.existsByTenantAndNameIgnoreCase(tenant, request.name())) {
      throw new RuntimeException("Já existe um cargo com este nome");
    }

    ChurchRole role = new ChurchRole();
    role.setTenant(tenant);
    role.setName(request.name());
    role.setSortOrder(request.sortOrder());
    role.setIsActive(request.isActive() != null ? request.isActive() : true);

    ChurchRole saved = repository.save(role);
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<ChurchRoleResponse> listAll(UUID tenantId, Boolean activeOnly) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    List<ChurchRole> roles = activeOnly != null && activeOnly
        ? repository.findAllByTenantAndIsActiveTrueOrderBySortOrderAsc(tenant)
        : repository.findAllByTenantOrderBySortOrderAsc(tenant);

    return roles.stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public ChurchRoleResponse getById(UUID tenantId, UUID id) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    ChurchRole role = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Cargo não encontrado"));

    return toResponse(role);
  }

  @Transactional
  public ChurchRoleResponse update(UUID tenantId, UUID id, UpdateChurchRoleRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    ChurchRole role = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Cargo não encontrado"));

    if (request.name() != null) {
      role.setName(request.name());
    }
    if (request.sortOrder() != null) {
      role.setSortOrder(request.sortOrder());
    }
    if (request.isActive() != null) {
      role.setIsActive(request.isActive());
    }

    ChurchRole updated = repository.save(role);
    return toResponse(updated);
  }

  @Transactional
  public void delete(UUID tenantId, UUID id) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    ChurchRole role = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Cargo não encontrado"));

    // TODO: Validar se tem membros usando este cargo antes de deletar

    repository.delete(role);
  }

  private ChurchRoleResponse toResponse(ChurchRole role) {
    return new ChurchRoleResponse(
        role.getId(),
        role.getName(),
        role.getSortOrder(),
        role.getIsActive(),
        role.getCreatedAt(),
        role.getUpdatedAt()
    );
  }
}

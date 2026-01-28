package com.eclesys.api.features.functionroles.service;

import com.eclesys.api.features.functionroles.entity.FunctionRole;
import com.eclesys.api.features.functionroles.repository.FunctionRoleRepository;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import com.eclesys.api.features.functionroles.dto.CreateFunctionRoleRequest;
import com.eclesys.api.features.functionroles.dto.FunctionRoleResponse;
import com.eclesys.api.features.functionroles.dto.UpdateFunctionRoleRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FunctionRoleService {

  private final FunctionRoleRepository repository;
  private final TenantRepository tenantRepository;

  public FunctionRoleService(
      FunctionRoleRepository repository,
      TenantRepository tenantRepository
  ) {
    this.repository = repository;
    this.tenantRepository = tenantRepository;
  }

  @Transactional
  public FunctionRoleResponse create(UUID tenantId, CreateFunctionRoleRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    if (repository.existsByTenantAndNameIgnoreCase(tenant, request.name())) {
      throw new RuntimeException("Já existe uma função com este nome");
    }

    FunctionRole role = new FunctionRole();
    role.setTenant(tenant);
    role.setName(request.name());
    role.setScopeType(request.scopeType());
    role.setMaxHolders(request.maxHolders());
    role.setSortOrder(request.sortOrder());
    role.setIsActive(request.isActive() != null ? request.isActive() : true);

    FunctionRole saved = repository.save(role);
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<FunctionRoleResponse> listAll(UUID tenantId, Boolean activeOnly) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    List<FunctionRole> roles = activeOnly != null && activeOnly
        ? repository.findAllByTenantAndIsActiveTrueOrderBySortOrderAsc(tenant)
        : repository.findAllByTenantOrderBySortOrderAsc(tenant);

    return roles.stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public FunctionRoleResponse getById(UUID tenantId, UUID id) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    FunctionRole role = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Função não encontrada"));

    return toResponse(role);
  }

  @Transactional
  public FunctionRoleResponse update(UUID tenantId, UUID id, UpdateFunctionRoleRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    FunctionRole role = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Função não encontrada"));

    if (request.name() != null) {
      role.setName(request.name());
    }
    if (request.scopeType() != null) {
      role.setScopeType(request.scopeType());
    }
    if (request.maxHolders() != null) {
      role.setMaxHolders(request.maxHolders());
    }
    if (request.sortOrder() != null) {
      role.setSortOrder(request.sortOrder());
    }
    if (request.isActive() != null) {
      role.setIsActive(request.isActive());
    }

    FunctionRole updated = repository.save(role);
    return toResponse(updated);
  }

  @Transactional
  public void delete(UUID tenantId, UUID id) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    FunctionRole role = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Função não encontrada"));

    // TODO: Validar se tem membros usando esta função antes de deletar

    repository.delete(role);
  }

  private FunctionRoleResponse toResponse(FunctionRole role) {
    return new FunctionRoleResponse(
        role.getId(),
        role.getName(),
        role.getScopeType(),
        role.getMaxHolders(),
        role.getSortOrder(),
        role.getIsActive(),
        role.getCreatedAt(),
        role.getUpdatedAt()
    );
  }
}

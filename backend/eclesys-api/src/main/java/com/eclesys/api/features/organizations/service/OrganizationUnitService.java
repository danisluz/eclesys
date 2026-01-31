package com.eclesys.api.features.organizations.service;

import com.eclesys.api.features.organizations.entity.*;
import com.eclesys.api.features.organizations.repository.OrganizationUnitRepository;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import com.eclesys.api.features.users.entity.OrganizationRole;
import com.eclesys.api.features.users.entity.UserOrganizationRole;
import com.eclesys.api.features.organizations.dto.CreateOrganizationUnitRequest;
import com.eclesys.api.features.organizations.dto.OrganizationUnitResponse;
import com.eclesys.api.features.organizations.dto.UpdateOrganizationUnitRequest;
import com.eclesys.api.features.users.repository.UserOrganizationRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationUnitService {

  private final OrganizationUnitRepository repository;
  private final TenantRepository tenantRepository;
  private final UserOrganizationRoleRepository userOrgRoleRepository;

  public OrganizationUnitService(
      OrganizationUnitRepository repository,
      TenantRepository tenantRepository,
      UserOrganizationRoleRepository userOrgRoleRepository
  ) {
    this.repository = repository;
    this.tenantRepository = tenantRepository;
    this.userOrgRoleRepository = userOrgRoleRepository;
  }

  @Transactional
  public OrganizationUnitResponse create(UUID tenantId, CreateOrganizationUnitRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    validateCreation(tenant, request);

    OrganizationUnit unit = new OrganizationUnit();
    unit.setTenant(tenant);
    unit.setType(request.type());
    unit.setName(request.name());
    unit.setCode(request.code());

    if (request.parentId() != null) {
      OrganizationUnit parent = repository.findByTenantAndId(tenant, request.parentId())
          .orElseThrow(() -> new RuntimeException("Unidade pai não encontrada"));
      unit.setParent(parent);
    }

    // CHURCH sempre é headquarters
    if (request.type() == OrganizationUnitType.CHURCH) {
      unit.setHeadquarters(true);
      unit.setSectorLabel(request.sectorLabel());
      unit.setCongregationLabel(request.congregationLabel());
      unit.setContactEmail(request.contactEmail());
      unit.setContactPhone(request.contactPhone());
      unit.setWebsite(request.website());
      unit.setAddress(request.address());
    } else if (request.type() == OrganizationUnitType.CONGREGATION && request.isHeadquarters() != null) {
      unit.setHeadquarters(request.isHeadquarters());
    }

    OrganizationUnit saved = repository.save(unit);
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<OrganizationUnitResponse> listAll(UUID tenantId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    List<OrganizationUnit> roots = repository.findAllByTenantAndParentIsNull(tenant);
    return roots.stream()
        .map(this::toResponseWithChildren)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public OrganizationUnitResponse getById(UUID tenantId, UUID id) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    OrganizationUnit unit = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Unidade organizacional não encontrada"));

    return toResponseWithChildren(unit);
  }

  @Transactional
  public OrganizationUnitResponse update(UUID tenantId, UUID id, UpdateOrganizationUnitRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    OrganizationUnit unit = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Unidade organizacional não encontrada"));

    if (request.name() != null) {
      unit.setName(request.name());
    }
    if (request.code() != null) {
      unit.setCode(request.code());
    }
    if (request.status() != null) {
      unit.setStatus(request.status());
    }
    if (unit.getType() == OrganizationUnitType.CHURCH) {
      if (request.contactEmail() != null) {
        unit.setContactEmail(request.contactEmail());
      }
      if (request.contactPhone() != null) {
        unit.setContactPhone(request.contactPhone());
      }
      if (request.website() != null) {
        unit.setWebsite(request.website());
      }
      if (request.address() != null) {
        unit.setAddress(request.address());
      }
    }

    OrganizationUnit updated = repository.save(unit);
    return toResponse(updated);
  }

  @Transactional
  public void delete(UUID tenantId, UUID id) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    OrganizationUnit unit = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Unidade organizacional não encontrada"));

    // Não permite deletar se tem filhos
    if (repository.hasChildren(id)) {
      throw new RuntimeException("Não é possível deletar uma unidade que possui unidades filhas");
    }

    repository.delete(unit);
  }

  private void validateCreation(TenantEntity tenant, CreateOrganizationUnitRequest request) {
    // CHURCH não pode ter parent
    if (request.type() == OrganizationUnitType.CHURCH && request.parentId() != null) {
      throw new RuntimeException("CHURCH não pode ter unidade pai");
    }

    // CHURCH: apenas 1 por tenant
    if (request.type() == OrganizationUnitType.CHURCH) {
      if (repository.existsByTenantAndType(tenant, OrganizationUnitType.CHURCH)) {
        throw new RuntimeException("Já existe uma CHURCH para este tenant");
      }
      // CHURCH deve ter labels para sector e congregation
      if (request.sectorLabel() == null || request.sectorLabel().isBlank()) {
        throw new RuntimeException("CHURCH deve ter um nome para o segundo nível (ex: Setor, Distrito, Região)");
      }
      if (request.congregationLabel() == null || request.congregationLabel().isBlank()) {
        throw new RuntimeException("CHURCH deve ter um nome para o terceiro nível (ex: Congregação, Ponto de Pregação, Missão)");
      }
    }

    // SECTOR deve ter CHURCH como pai
    if (request.type() == OrganizationUnitType.SECTOR) {
      if (request.parentId() == null) {
        throw new RuntimeException("SECTOR deve ter uma CHURCH como pai");
      }
      OrganizationUnit parent = repository.findByTenantAndId(tenant, request.parentId())
          .orElseThrow(() -> new RuntimeException("Unidade pai não encontrada"));
      if (parent.getType() != OrganizationUnitType.CHURCH) {
        throw new RuntimeException("SECTOR só pode ter CHURCH como pai");
      }
    }

    // CONGREGATION deve ter SECTOR como pai
    if (request.type() == OrganizationUnitType.CONGREGATION) {
      if (request.parentId() == null) {
        throw new RuntimeException("CONGREGATION deve ter um SECTOR como pai");
      }
      OrganizationUnit parent = repository.findByTenantAndId(tenant, request.parentId())
          .orElseThrow(() -> new RuntimeException("Unidade pai não encontrada"));
      if (parent.getType() != OrganizationUnitType.SECTOR) {
        throw new RuntimeException("CONGREGATION só pode ter SECTOR como pai");
      }
    }
  }

  private OrganizationUnitResponse toResponse(OrganizationUnit unit) {
    // Buscar cargo de líder para esta unidade (com JOIN FETCH para carregar user/member)
    List<UserOrganizationRole> roles = userOrgRoleRepository.findByOrganizationUnitIdWithDetails(unit.getId());
    
    // TODO: Implementar busca de líder via FunctionRole com nome "Líder" ou similar
    String leaderName = roles.stream()
        .filter(r -> r.getFunctionRole() != null && "Líder".equalsIgnoreCase(r.getFunctionRole().getName()))
        .map(r -> {
          if (r.getMember() != null) {
            return r.getMember().getFullName();
          } else if (r.getUser() != null) {
            return r.getUser().getName();
          }
          return null;
        })
        .findFirst()
        .orElse(null);
    
    Integer assignmentsCount = roles.size();
    
    return new OrganizationUnitResponse(
        unit.getId(),
        unit.getType(),
        unit.getName(),
        unit.getCode(),
        unit.getParent() != null ? unit.getParent().getId() : null,
        unit.getParent() != null ? unit.getParent().getName() : null,
        unit.getStatus(),
        unit.isHeadquarters(),
        unit.getSectorLabel(),
        unit.getCongregationLabel(),
        unit.getContactEmail(),
        unit.getContactPhone(),
        unit.getWebsite(),
        unit.getAddress(),
        unit.getCreatedAt(),
        unit.getUpdatedAt(),
        new ArrayList<>(),
        leaderName,
        assignmentsCount
    );
  }

  private OrganizationUnitResponse toResponseWithChildren(OrganizationUnit unit) {
    List<OrganizationUnit> children = repository.findAllByTenantAndParent(unit.getTenant(), unit);
    List<OrganizationUnitResponse> childrenResponse = children.stream()
        .map(this::toResponseWithChildren)
        .collect(Collectors.toList());

    // Buscar cargo de líder para esta unidade (com JOIN FETCH para carregar user/member)
    List<UserOrganizationRole> roles = userOrgRoleRepository.findByOrganizationUnitIdWithDetails(unit.getId());
    
    // TODO: Implementar busca de líder via FunctionRole com nome "Líder" ou similar
    String leaderName = roles.stream()
        .filter(r -> r.getFunctionRole() != null && "Líder".equalsIgnoreCase(r.getFunctionRole().getName()))
        .map(r -> {
          if (r.getMember() != null) {
            return r.getMember().getFullName();
          } else if (r.getUser() != null) {
            return r.getUser().getName();
          }
          return null;
        })
        .findFirst()
        .orElse(null);
    
    Integer assignmentsCount = roles.size();

    return new OrganizationUnitResponse(
        unit.getId(),
        unit.getType(),
        unit.getName(),
        unit.getCode(),
        unit.getParent() != null ? unit.getParent().getId() : null,
        unit.getParent() != null ? unit.getParent().getName() : null,
        unit.getStatus(),
        unit.isHeadquarters(),
        unit.getSectorLabel(),
        unit.getCongregationLabel(),
        unit.getContactEmail(),
        unit.getContactPhone(),
        unit.getWebsite(),
        unit.getAddress(),
        unit.getCreatedAt(),
        unit.getUpdatedAt(),
        childrenResponse,
        leaderName,
        assignmentsCount
    );
  }
}

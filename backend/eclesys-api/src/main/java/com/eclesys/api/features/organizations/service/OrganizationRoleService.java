package com.eclesys.api.features.organizations.service;

import com.eclesys.api.features.organizations.entity.OrganizationUnit;
import com.eclesys.api.features.organizations.repository.OrganizationUnitRepository;
import com.eclesys.api.features.organizations.entity.OrganizationUnitType;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import com.eclesys.api.features.users.entity.UserEntity;
import com.eclesys.api.features.users.entity.UserOrganizationRole;
import com.eclesys.api.features.users.repository.UserRepository;
import com.eclesys.api.features.members.entity.Member;
import com.eclesys.api.features.members.repository.MemberRepository;
import com.eclesys.api.features.functionroles.entity.FunctionRole;
import com.eclesys.api.features.functionroles.repository.FunctionRoleRepository;
import com.eclesys.api.features.organizations.dto.AssignRoleRequest;
import com.eclesys.api.features.organizations.dto.RoleAssignmentResponse;
import com.eclesys.api.features.users.repository.UserOrganizationRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationRoleService {

  private final UserOrganizationRoleRepository roleRepository;
  private final OrganizationUnitRepository orgUnitRepository;
  private final UserRepository userRepository;
  private final MemberRepository memberRepository;
  private final TenantRepository tenantRepository;
  private final FunctionRoleRepository functionRoleRepository;

  public OrganizationRoleService(
      UserOrganizationRoleRepository roleRepository,
      OrganizationUnitRepository orgUnitRepository,
      UserRepository userRepository,
      MemberRepository memberRepository,
      TenantRepository tenantRepository,
      FunctionRoleRepository functionRoleRepository
  ) {
    this.roleRepository = roleRepository;
    this.orgUnitRepository = orgUnitRepository;
    this.userRepository = userRepository;
    this.memberRepository = memberRepository;
    this.tenantRepository = tenantRepository;
    this.functionRoleRepository = functionRoleRepository;
  }

  @Transactional
  public RoleAssignmentResponse assignRole(
      UUID tenantId,
      UUID requestingUserId,
      UUID organizationUnitId,
      AssignRoleRequest request
  ) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    OrganizationUnit unit = orgUnitRepository.findByTenantAndId(tenant, organizationUnitId)
        .orElseThrow(() -> new RuntimeException("Unidade organizacional não encontrada"));

    Member targetMember = memberRepository.findById(request.userId())
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    FunctionRole functionRole = functionRoleRepository.findById(request.functionRoleId())
        .orElseThrow(() -> new RuntimeException("Cargo não encontrado"));

    // Validar se o usuário solicitante tem permissão
    validateAssignmentPermission(requestingUserId, unit, tenant);

    // Verificar se já existe essa atribuição
    if (roleRepository.findByMemberIdAndOrganizationUnitIdAndFunctionRoleId(
        request.userId(), organizationUnitId, request.functionRoleId()).isPresent()) {
      throw new RuntimeException("Este membro já possui este cargo nesta unidade");
    }

    UserOrganizationRole role = new UserOrganizationRole();
    role.setMember(targetMember);
    role.setOrganizationUnit(unit);
    role.setFunctionRole(functionRole);

    UserOrganizationRole saved = roleRepository.save(role);
    return toResponse(saved);
  }

  @Transactional
  public void removeRole(
      UUID tenantId,
      UUID requestingUserId,
      UUID organizationUnitId,
      UUID userId,
      UUID functionRoleId
  ) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    OrganizationUnit unit = orgUnitRepository.findByTenantAndId(tenant, organizationUnitId)
        .orElseThrow(() -> new RuntimeException("Unidade organizacional não encontrada"));

    // Validar se o usuário solicitante tem permissão
    validateAssignmentPermission(requestingUserId, unit, tenant);

    UserOrganizationRole assignment = roleRepository
        .findByMemberIdAndOrganizationUnitIdAndFunctionRoleId(userId, organizationUnitId, functionRoleId)
        .orElseThrow(() -> new RuntimeException("Atribuição não encontrada"));

    roleRepository.delete(assignment);
  }

  @Transactional(readOnly = true)
  public List<RoleAssignmentResponse> listRolesByOrganizationUnit(UUID tenantId, UUID organizationUnitId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    OrganizationUnit unit = orgUnitRepository.findByTenantAndId(tenant, organizationUnitId)
        .orElseThrow(() -> new RuntimeException("Unidade organizacional não encontrada"));

    List<UserOrganizationRole> roles = roleRepository.findByOrganizationUnitIdWithDetails(organizationUnitId);
    return roles.stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  /**
   * Valida se o usuário solicitante tem permissão para atribuir cargos nesta unidade.
   * Regras:
   * - ADMIN pode tudo
   * - Usuários com cargos administrativos podem gerenciar cargos dentro da hierarquia
   */
  private void validateAssignmentPermission(UUID requestingUserId, OrganizationUnit targetUnit, TenantEntity tenant) {
    // Verificar se é ADMIN
    UserEntity requestingUser = userRepository.findById(requestingUserId)
        .orElseThrow(() -> new RuntimeException("Usuário solicitante não encontrado"));
    
    if (requestingUser.getRole() == com.eclesys.api.features.users.entity.UserRole.ADMIN) {
      // ADMIN pode tudo
      return;
    }
    
    // Buscar cargos do usuário solicitante
    List<UserOrganizationRole> userRoles = roleRepository.findByUserId(requestingUserId);

    if (userRoles.isEmpty()) {
      throw new RuntimeException("Apenas usuários com cargos administrativos ou ADMIN podem atribuir cargos");
    }

    // Verificar se tem permissão hierárquica
    boolean hasPermission = false;

    for (UserOrganizationRole userRole : userRoles) {
      OrganizationUnit userUnit = userRole.getOrganizationUnit();

      // Se é secretaria da CHURCH (raiz), pode tudo
      if (userUnit.getType() == OrganizationUnitType.CHURCH) {
        hasPermission = true;
        break;
      }

      // Se é secretaria do SECTOR
      if (userUnit.getType() == OrganizationUnitType.SECTOR) {
        // Pode atribuir no próprio SECTOR
        if (targetUnit.getId().equals(userUnit.getId())) {
          hasPermission = true;
          break;
        }
        // Pode atribuir em CONGREGATIONs filhas deste SECTOR
        if (targetUnit.getType() == OrganizationUnitType.CONGREGATION &&
            targetUnit.getParent() != null &&
            targetUnit.getParent().getId().equals(userUnit.getId())) {
          hasPermission = true;
          break;
        }
      }

      // Se é secretaria da CONGREGATION, só pode atribuir na própria CONGREGATION
      if (userUnit.getType() == OrganizationUnitType.CONGREGATION &&
          targetUnit.getId().equals(userUnit.getId())) {
        hasPermission = true;
        break;
      }
    }

    if (!hasPermission) {
      throw new RuntimeException("Você não tem permissão para atribuir cargos nesta unidade organizacional");
    }
  }

  private RoleAssignmentResponse toResponse(UserOrganizationRole role) {
    UUID userId;
    String userName;
    
    if (role.getMember() != null) {
      userId = role.getMember().getId();
      userName = role.getMember().getFullName();
    } else if (role.getUser() != null) {
      userId = role.getUser().getId();
      userName = role.getUser().getName();
    } else {
      throw new RuntimeException("UserOrganizationRole deve ter ou User ou Member");
    }
    
    UUID functionRoleId = role.getFunctionRole() != null ? role.getFunctionRole().getId() : null;
    String functionRoleName = role.getFunctionRole() != null ? role.getFunctionRole().getName() : null;
    
    return new RoleAssignmentResponse(
        role.getId(),
        userId,
        userName,
        role.getOrganizationUnit().getId(),
        role.getOrganizationUnit().getName(),
        functionRoleId,
        functionRoleName,
        role.getCreatedAt()
    );
  }
}

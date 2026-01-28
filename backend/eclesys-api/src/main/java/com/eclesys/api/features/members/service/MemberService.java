package com.eclesys.api.features.members.service;

import com.eclesys.api.features.churchroles.entity.ChurchRole;
import com.eclesys.api.features.churchroles.repository.ChurchRoleRepository;
import com.eclesys.api.features.members.entity.Member;
import com.eclesys.api.features.members.entity.MemberPositionHistory;
import com.eclesys.api.features.members.entity.MemberRegistrationSequence;
import com.eclesys.api.features.members.repository.MemberPositionHistoryRepository;
import com.eclesys.api.features.members.repository.MemberRepository;
import com.eclesys.api.features.members.repository.MemberRegistrationSequenceRepository;
import com.eclesys.api.features.members.entity.MemberStatus;
import com.eclesys.api.features.members.entity.MemberTransfer;
import com.eclesys.api.features.members.repository.MemberTransferRepository;
import com.eclesys.api.features.members.entity.TransferStatus;
import com.eclesys.api.features.organizations.entity.OrganizationUnit;
import com.eclesys.api.features.organizations.repository.OrganizationUnitRepository;
import com.eclesys.api.features.tenants.entity.ApprovalLevel;
import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import com.eclesys.api.features.users.entity.UserEntity;
import com.eclesys.api.features.users.repository.UserRepository;
import com.eclesys.api.features.members.dto.*;
import com.eclesys.api.features.transfers.service.TransferApprovalService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MemberService {

  private final MemberRepository repository;
  private final TenantRepository tenantRepository;
  private final ChurchRoleRepository churchRoleRepository;
  private final OrganizationUnitRepository organizationUnitRepository;
  private final MemberTransferRepository transferRepository;
  private final UserRepository userRepository;
  private final TransferApprovalService approvalService;
  private final MemberPositionHistoryRepository positionHistoryRepository;
  private final MemberRegistrationSequenceRepository registrationSequenceRepository;

  public MemberService(
      MemberRepository repository,
      TenantRepository tenantRepository,
      ChurchRoleRepository churchRoleRepository,
      OrganizationUnitRepository organizationUnitRepository,
      MemberTransferRepository transferRepository,
      UserRepository userRepository,
      TransferApprovalService approvalService,
      MemberPositionHistoryRepository positionHistoryRepository,
      MemberRegistrationSequenceRepository registrationSequenceRepository
  ) {
    this.repository = repository;
    this.tenantRepository = tenantRepository;
    this.churchRoleRepository = churchRoleRepository;
    this.organizationUnitRepository = organizationUnitRepository;
    this.transferRepository = transferRepository;
    this.userRepository = userRepository;
    this.approvalService = approvalService;
    this.positionHistoryRepository = positionHistoryRepository;
    this.registrationSequenceRepository = registrationSequenceRepository;
  }

  @Transactional
  public MemberResponse create(UUID tenantId, CreateMemberRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    // Validar CPF obrigatório
    if (request.document() == null || request.document().trim().isEmpty()) {
      throw new IllegalArgumentException("CPF é obrigatório");
    }

    // Validar formato do CPF
    if (!com.eclesys.api.util.CpfValidator.isValid(request.document())) {
      throw new IllegalArgumentException("CPF inválido");
    }

    // Validar CPF único no tenant
    if (repository.existsByTenantAndDocument(tenant, request.document())) {
      throw new IllegalArgumentException("Já existe um membro cadastrado com este CPF");
    }

    OrganizationUnit organizationUnit = organizationUnitRepository.findByTenantAndId(tenant, request.organizationUnitId())
        .orElseThrow(() -> new RuntimeException("Congregação não encontrada"));

    Member member = new Member();
    member.setTenant(tenant);
    member.setFullName(request.fullName());
    member.setEmail(request.email());
    member.setPhone(request.phone());
    member.setDocument(request.document());
    member.setBirthDate(request.birthDate());
    member.setBaptismDate(request.baptismDate());
    member.setBaptismChurch(request.baptismChurch());
    member.setBaptismLocation(request.baptismLocation());
    member.setGender(request.gender());
    member.setMaritalStatus(request.maritalStatus());
    member.setAddress(addressDtoToMap(request.address()));
    member.setStatus(MemberStatus.ACTIVE);
    member.setOrganizationUnit(organizationUnit);

    if (request.churchRoleId() != null) {
      ChurchRole churchRole = churchRoleRepository.findByTenantAndId(tenant, request.churchRoleId())
          .orElseThrow(() -> new RuntimeException("Cargo eclesiástico não encontrado"));
      member.setChurchRole(churchRole);
    }

    // Relacionamentos familiares
    if (request.spouseId() != null) {
      Member spouse = repository.findByTenantAndId(tenant, request.spouseId())
          .orElseThrow(() -> new RuntimeException("Cônjuge não encontrado"));
      member.setSpouse(spouse);
    }
    if (request.fatherId() != null) {
      Member father = repository.findByTenantAndId(tenant, request.fatherId())
          .orElseThrow(() -> new RuntimeException("Pai não encontrado"));
      member.setFather(father);
    }
    if (request.motherId() != null) {
      Member mother = repository.findByTenantAndId(tenant, request.motherId())
          .orElseThrow(() -> new RuntimeException("Mãe não encontrada"));
      member.setMother(mother);
    }

    member.setRegistrationNumber(nextRegistrationNumber(tenant.getId()));

    Member saved = repository.save(member);
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public Page<MemberResponse> listAll(
      UUID tenantId, 
      MemberStatus status, 
      String search,
      List<UUID> organizationUnitIds,
      UUID churchRoleId,
      Pageable pageable
  ) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Page<Member> members;
    boolean hasOrgFilter = organizationUnitIds != null && !organizationUnitIds.isEmpty();

    // Busca com filtros combinados
    if (search != null && !search.isBlank()) {
      members = repository.searchByTenantWithFilters(
          tenant, 
          search, 
          status, 
          hasOrgFilter ? organizationUnitIds : null, 
          churchRoleId, 
          pageable
      );
    } else if (status != null || hasOrgFilter || churchRoleId != null) {
      members = repository.findAllByTenantWithFilters(
          tenant, 
          status, 
          hasOrgFilter ? organizationUnitIds : null, 
          churchRoleId, 
          pageable
      );
    } else {
      members = repository.findAllByTenant(tenant, pageable);
    }

    return members.map(this::toResponse);
  }

  @Transactional(readOnly = true)
  public MemberResponse getById(UUID tenantId, UUID id) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    return toResponse(member);
  }

  @Transactional
  public MemberResponse update(UUID tenantId, UUID id, UpdateMemberRequest request, UUID updatingUserId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    UserEntity updatingUser = userRepository.findById(updatingUserId)
        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

    // CPF não pode ser alterado
    if (request.document() != null && !request.document().equals(member.getDocument())) {
      throw new IllegalArgumentException("CPF não pode ser alterado após o cadastro");
    }

    if (request.fullName() != null) {
      member.setFullName(request.fullName());
    }
    if (request.email() != null) {
      member.setEmail(request.email());
    }
    if (request.phone() != null) {
      member.setPhone(request.phone());
    }
    if (request.birthDate() != null) {
      member.setBirthDate(request.birthDate());
    }
    if (request.baptismDate() != null) {
      member.setBaptismDate(request.baptismDate());
    }
    if (request.baptismChurch() != null) {
      member.setBaptismChurch(request.baptismChurch());
    }
    if (request.baptismLocation() != null) {
      member.setBaptismLocation(request.baptismLocation());
    }
    if (request.gender() != null) {
      member.setGender(request.gender());
    }
    if (request.maritalStatus() != null) {
      member.setMaritalStatus(request.maritalStatus());
    }
    if (request.address() != null) {
      member.setAddress(addressDtoToMap(request.address()));
    }
    
    // Status: não permitir mudar para TRANSFERRED (só via aprovação de transferência)
    if (request.status() != null) {
      if (request.status() == MemberStatus.TRANSFERRED) {
        throw new IllegalArgumentException("Status TRANSFERRED só pode ser definido via aprovação de transferência");
      }
      member.setStatus(request.status());
    }
    
    if (request.organizationUnitId() != null) {
      OrganizationUnit organizationUnit = organizationUnitRepository.findByTenantAndId(tenant, request.organizationUnitId())
          .orElseThrow(() -> new RuntimeException("Congregação não encontrada"));
      member.setOrganizationUnit(organizationUnit);
    }
    
    // Cargo eclesiástico: apenas ADMIN ou SECRETARIA podem alterar
    if (request.churchRoleId() != null) {
      if (updatingUser.getRole() != com.eclesys.api.features.users.entity.UserRole.ADMIN && 
          updatingUser.getRole() != com.eclesys.api.features.users.entity.UserRole.SECRETARIA) {
        throw new SecurityException("Apenas administradores e secretários gerais podem alterar cargos eclesiásticos");
      }
      
      // Registrar mudança no histórico
      ChurchRole newRole = request.churchRoleId().toString().equals("00000000-0000-0000-0000-000000000000") ? null :
          churchRoleRepository.findByTenantAndId(tenant, request.churchRoleId())
              .orElseThrow(() -> new RuntimeException("Cargo eclesiástico não encontrado"));
      
      if (member.getChurchRole() != newRole) {
        MemberPositionHistory history = new MemberPositionHistory();
        history.setTenant(tenant);
        history.setMember(member);
        history.setOldPosition(member.getChurchRole() != null ? member.getChurchRole().getName() : null);
        history.setNewPosition(newRole != null ? newRole.getName() : null);
        history.setChangedBy(updatingUser);
        positionHistoryRepository.save(history);
        
        member.setChurchRole(newRole);
      }
    }
    
    if (request.spouseId() != null) {
      Member spouse = repository.findByTenantAndId(tenant, request.spouseId())
          .orElseThrow(() -> new RuntimeException("Cônjuge não encontrado"));
      member.setSpouse(spouse);
    }
    if (request.fatherId() != null) {
      Member father = repository.findByTenantAndId(tenant, request.fatherId())
          .orElseThrow(() -> new RuntimeException("Pai não encontrado"));
      member.setFather(father);
    }
    if (request.motherId() != null) {
      Member mother = repository.findByTenantAndId(tenant, request.motherId())
          .orElseThrow(() -> new RuntimeException("Mãe não encontrada"));
      member.setMother(mother);
    }

    Member updated = repository.save(member);
    return toResponse(updated);
  }

  @Transactional
  public void delete(UUID tenantId, UUID id) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    // TODO: Validar se tem assignments antes de deletar

    repository.delete(member);
  }

  private MemberResponse toResponse(Member member) {
    String churchRoleName = member.getChurchRole() != null ? member.getChurchRole().getName() : null;
    UUID churchRoleId = member.getChurchRole() != null ? member.getChurchRole().getId() : null;
    
    UUID organizationUnitId = member.getOrganizationUnit() != null ? member.getOrganizationUnit().getId() : null;
    String organizationUnitName = member.getOrganizationUnit() != null ? member.getOrganizationUnit().getName() : null;
    
    AddressDto addressDto = mapToAddressDto(member.getAddress());
    FamilyRelationshipsDto familyDto = toFamilyDto(member);

    return new MemberResponse(
        member.getId(),
        member.getFullName(),
        member.getEmail(),
        member.getPhone(),
        member.getDocument(),
        member.getRegistrationNumber(),
        member.getBirthDate(),
        member.getBaptismDate(),
        member.getBaptismChurch(),
        member.getBaptismLocation(),
        member.getGender(),
        member.getMaritalStatus(),
        addressDto,
        member.getStatus(),
        organizationUnitId,
        organizationUnitName,
        churchRoleId,
        churchRoleName,
        familyDto,
        member.getCreatedAt(),
        member.getUpdatedAt()
    );
  }

  private int nextRegistrationNumber(UUID tenantId) {
    try {
      MemberRegistrationSequence sequence = registrationSequenceRepository.findByTenantIdForUpdate(tenantId)
          .orElseGet(() -> createRegistrationSequence(tenantId));
      int current = sequence.getNextNumber();
      sequence.setNextNumber(current + 1);
      return current;
    } catch (DataIntegrityViolationException ex) {
      MemberRegistrationSequence sequence = registrationSequenceRepository.findByTenantIdForUpdate(tenantId)
          .orElseThrow(() -> new IllegalStateException("Sequência de matrícula não encontrada"));
      int current = sequence.getNextNumber();
      sequence.setNextNumber(current + 1);
      return current;
    }
  }

  private MemberRegistrationSequence createRegistrationSequence(UUID tenantId) {
    MemberRegistrationSequence sequence = new MemberRegistrationSequence();
    sequence.setTenantId(tenantId);
    sequence.setNextNumber(1);
    return registrationSequenceRepository.save(sequence);
  }

  private Map<String, Object> addressDtoToMap(AddressDto dto) {
    if (dto == null) return null;
    
    Map<String, Object> map = new HashMap<>();
    if (dto.street() != null) map.put("street", dto.street());
    if (dto.number() != null) map.put("number", dto.number());
    if (dto.complement() != null) map.put("complement", dto.complement());
    if (dto.neighborhood() != null) map.put("neighborhood", dto.neighborhood());
    if (dto.city() != null) map.put("city", dto.city());
    if (dto.state() != null) map.put("state", dto.state());
    if (dto.zipCode() != null) map.put("zipCode", dto.zipCode());
    
    return map.isEmpty() ? null : map;
  }

  private AddressDto mapToAddressDto(Map<String, Object> map) {
    if (map == null) return null;
    
    return new AddressDto(
        (String) map.get("street"),
        (String) map.get("number"),
        (String) map.get("complement"),
        (String) map.get("neighborhood"),
        (String) map.get("city"),
        (String) map.get("state"),
        (String) map.get("zipCode")
    );
  }

  private FamilyRelationshipsDto toFamilyDto(Member member) {
    Member spouse = member.getSpouse();
    Member father = member.getFather();
    Member mother = member.getMother();
    
    UUID spouseId = spouse != null ? spouse.getId() : null;
    String spouseName = spouse != null ? spouse.getFullName() : null;
    
    UUID fatherId = father != null ? father.getId() : null;
    String fatherName = father != null ? father.getFullName() : null;
    
    UUID motherId = mother != null ? mother.getId() : null;
    String motherName = mother != null ? mother.getFullName() : null;
    
    return new FamilyRelationshipsDto(
        spouseId, spouseName,
        fatherId, fatherName,
        motherId, motherName
    );
  }

  // ==================== TRANSFERÊNCIAS ====================

  @Transactional
  public MemberTransferResponse transferMember(UUID tenantId, UUID memberId, TransferMemberRequest request, UUID userId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = repository.findByTenantAndId(tenant, memberId)
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

    OrganizationUnit fromCongregation = member.getOrganizationUnit();
    MemberTransfer transfer = new MemberTransfer();
    transfer.setTenant(tenant);
    transfer.setMember(member);
    transfer.setFromCongregation(fromCongregation);
    transfer.setTransferredBy(user);
    transfer.setRequestedBy(user);

    if (request.toCongregationId() != null) {
      // Transferência interna (dentro do mesmo tenant)
      OrganizationUnit toCongregation = organizationUnitRepository.findByTenantAndId(tenant, request.toCongregationId())
          .orElseThrow(() -> new RuntimeException("Congregação de destino não encontrada"));

      transfer.setToCongregation(toCongregation);
      transfer.setReason(request.reason());
    } else {
      // Transferência externa (para outra igreja/cidade)
      if (request.externalDestination() == null || request.externalDestination().isBlank()) {
        throw new RuntimeException("Destino externo deve ser informado para transferência externa");
      }

      transfer.setToCongregation(null);
      transfer.setReason(request.reason() + " | Destino: " + request.externalDestination());
    }

    // Determine approval level
    ApprovalLevel requiredLevel = approvalService.determineRequiredApprovalLevel(transfer);

    if (requiredLevel == ApprovalLevel.AUTO) {
      // Auto-approve: execute immediately
      transfer.setStatus(TransferStatus.APPROVED);
      transfer.setApprovedBy(user);
      transfer.setApprovedAt(java.time.LocalDateTime.now());

      // Execute transfer
      if (transfer.getToCongregation() != null) {
        member.setOrganizationUnit(transfer.getToCongregation());
      } else {
        member.setStatus(MemberStatus.TRANSFERRED);
      }
      repository.save(member);
    } else {
      // Requires approval: create as PENDING
      transfer.setStatus(TransferStatus.PENDING);
      // Member stays in current congregation until approved
    }

    MemberTransfer saved = transferRepository.save(transfer);
    return toTransferResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<MemberTransferResponse> getMemberTransferHistory(UUID tenantId, UUID memberId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = repository.findByTenantAndId(tenant, memberId)
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    return transferRepository.findByTenantAndMemberOrderByCreatedAtDesc(tenant, member)
        .stream()
        .map(this::toTransferResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<MemberPositionHistoryResponse> getMemberPositionHistory(UUID tenantId, UUID memberId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = repository.findByTenantAndId(tenant, memberId)
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    return positionHistoryRepository.findByMemberIdOrderByChangedAtDesc(memberId)
        .stream()
        .map(this::toPositionHistoryResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<MemberTransferResponse> getAllTransfers(UUID tenantId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    return transferRepository.findByTenantOrderByCreatedAtDesc(tenant)
        .stream()
        .map(this::toTransferResponse)
        .collect(Collectors.toList());
  }

  public MemberTransferResponse toTransferResponse(MemberTransfer transfer) {
    OrganizationUnit from = transfer.getFromCongregation();
    OrganizationUnit to = transfer.getToCongregation();

    return new MemberTransferResponse(
        transfer.getId(),
        transfer.getMember().getId(),
        transfer.getMember().getFullName(),
        from != null ? from.getId() : null,
        from != null ? from.getName() : null,
        to != null ? to.getId() : null,
        to != null ? to.getName() : null,
        transfer.getReason(),
        transfer.getTransferredBy().getName(),
        transfer.getCreatedAt(),
        transfer.getStatus() != null ? transfer.getStatus().name() : null,
        transfer.getRequestedBy() != null ? transfer.getRequestedBy().getName() : null,
        transfer.getApprovedBy() != null ? transfer.getApprovedBy().getName() : null,
        transfer.getApprovedAt(),
        transfer.getRejectionReason()
    );
  }

  private MemberPositionHistoryResponse toPositionHistoryResponse(MemberPositionHistory history) {
    String oldPositionName = history.getOldPosition() != null ? 
        history.getOldPosition() : "Sem cargo";
    String newPositionName = history.getNewPosition() != null ? 
        history.getNewPosition() : "Sem cargo";
    String changedByUserName = history.getChangedBy() != null ? 
        history.getChangedBy().getName() : "Sistema";

    return new MemberPositionHistoryResponse(
        history.getId(),
        oldPositionName,
        newPositionName,
        history.getReason(),
        changedByUserName,
        history.getChangedAt()
    );
  }

  /**
   * Retorna o histórico completo do membro (transferências + mudanças de cargo)
   * ordenado por data decrescente
   */
  @Transactional(readOnly = true)
  public List<MemberHistoryResponse> getMemberHistory(UUID tenantId, UUID memberId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = repository.findByTenantAndId(tenant, memberId)
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    List<MemberHistoryResponse> history = new java.util.ArrayList<>();

    // Adiciona histórico de mudanças de cargo
    positionHistoryRepository.findByMemberIdOrderByChangedAtDesc(memberId)
        .forEach(positionChange -> {
          history.add(new MemberHistoryResponse(
              positionChange.getId(),
              "POSITION_CHANGE",
              "Mudança de cargo",
              positionChange.getOldPosition() != null ? positionChange.getOldPosition() : "Sem cargo",
              positionChange.getNewPosition() != null ? positionChange.getNewPosition() : "Sem cargo",
              positionChange.getReason(),
              positionChange.getChangedBy() != null ? positionChange.getChangedBy().getName() : "Sistema",
              positionChange.getChangedAt(),
              null
          ));
        });

    // Adiciona histórico de transferências
    transferRepository.findByTenantAndMemberOrderByCreatedAtDesc(tenant, member)
        .forEach(transfer -> {
          String fromCongregation = transfer.getFromCongregation() != null 
              ? transfer.getFromCongregation().getName() 
              : "Sem congregação";
          String toCongregation = transfer.getToCongregation() != null 
              ? transfer.getToCongregation().getName() 
              : "Externa";
          
          String description = transfer.getToCongregation() != null 
              ? "Transferência interna" 
              : "Transferência externa";

          LocalDateTime eventDate = transfer.getApprovedAt() != null 
              ? transfer.getApprovedAt() 
              : transfer.getCreatedAt();

          history.add(new MemberHistoryResponse(
              transfer.getId(),
              "TRANSFER",
              description,
              fromCongregation,
              toCongregation,
              transfer.getReason(),
              transfer.getRequestedBy() != null ? transfer.getRequestedBy().getName() : "Sistema",
              eventDate,
              transfer.getStatus() != null ? transfer.getStatus().name() : "PENDING"
          ));
        });

    // Ordena por data decrescente
    history.sort((a, b) -> b.performedAt().compareTo(a.performedAt()));

    return history;
  }
}

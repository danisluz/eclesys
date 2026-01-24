package com.eclesys.api.features.members;

import com.eclesys.api.domain.churchrole.ChurchRole;
import com.eclesys.api.domain.churchrole.ChurchRoleRepository;
import com.eclesys.api.domain.member.Member;
import com.eclesys.api.domain.member.MemberRepository;
import com.eclesys.api.domain.member.MemberStatus;
import com.eclesys.api.domain.organization.OrganizationUnit;
import com.eclesys.api.domain.organization.OrganizationUnitRepository;
import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.tenant.TenantRepository;
import com.eclesys.api.features.members.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

  public MemberService(
      MemberRepository repository,
      TenantRepository tenantRepository,
      ChurchRoleRepository churchRoleRepository,
      OrganizationUnitRepository organizationUnitRepository
  ) {
    this.repository = repository;
    this.tenantRepository = tenantRepository;
    this.churchRoleRepository = churchRoleRepository;
    this.organizationUnitRepository = organizationUnitRepository;
  }

  @Transactional
  public MemberResponse create(UUID tenantId, CreateMemberRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

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

    Member saved = repository.save(member);
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<MemberResponse> listAll(UUID tenantId, MemberStatus status, String search) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    List<Member> members;

    if (search != null && !search.isBlank()) {
      members = repository.searchByTenant(tenant, search);
    } else if (status != null) {
      members = repository.findAllByTenantAndStatusOrderByFullNameAsc(tenant, status);
    } else {
      members = repository.findAllByTenantOrderByFullNameAsc(tenant);
    }

    return members.stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
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
  public MemberResponse update(UUID tenantId, UUID id, UpdateMemberRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = repository.findByTenantAndId(tenant, id)
        .orElseThrow(() -> new RuntimeException("Membro não encontrado"));

    if (request.fullName() != null) {
      member.setFullName(request.fullName());
    }
    if (request.email() != null) {
      member.setEmail(request.email());
    }
    if (request.phone() != null) {
      member.setPhone(request.phone());
    }
    if (request.document() != null) {
      member.setDocument(request.document());
    }
    if (request.birthDate() != null) {
      member.setBirthDate(request.birthDate());
    }
    if (request.baptismDate() != null) {
      member.setBaptismDate(request.baptismDate());
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
    if (request.status() != null) {
      member.setStatus(request.status());
    }
    if (request.organizationUnitId() != null) {
      OrganizationUnit organizationUnit = organizationUnitRepository.findByTenantAndId(tenant, request.organizationUnitId())
          .orElseThrow(() -> new RuntimeException("Congregação não encontrada"));
      member.setOrganizationUnit(organizationUnit);
    }
    if (request.churchRoleId() != null) {
      ChurchRole churchRole = churchRoleRepository.findByTenantAndId(tenant, request.churchRoleId())
          .orElseThrow(() -> new RuntimeException("Cargo eclesiástico não encontrado"));
      member.setChurchRole(churchRole);
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
        member.getBirthDate(),
        member.getBaptismDate(),
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
}

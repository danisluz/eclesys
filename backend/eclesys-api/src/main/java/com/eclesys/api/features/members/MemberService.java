package com.eclesys.api.features.members;

import com.eclesys.api.domain.churchrole.ChurchRole;
import com.eclesys.api.domain.churchrole.ChurchRoleRepository;
import com.eclesys.api.domain.member.Member;
import com.eclesys.api.domain.member.MemberRepository;
import com.eclesys.api.domain.member.MemberStatus;
import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.tenant.TenantRepository;
import com.eclesys.api.features.members.dto.CreateMemberRequest;
import com.eclesys.api.features.members.dto.MemberResponse;
import com.eclesys.api.features.members.dto.UpdateMemberRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MemberService {

  private final MemberRepository repository;
  private final TenantRepository tenantRepository;
  private final ChurchRoleRepository churchRoleRepository;

  public MemberService(
      MemberRepository repository,
      TenantRepository tenantRepository,
      ChurchRoleRepository churchRoleRepository
  ) {
    this.repository = repository;
    this.tenantRepository = tenantRepository;
    this.churchRoleRepository = churchRoleRepository;
  }

  @Transactional
  public MemberResponse create(UUID tenantId, CreateMemberRequest request) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Member member = new Member();
    member.setTenant(tenant);
    member.setFullName(request.fullName());
    member.setEmail(request.email());
    member.setPhone(request.phone());
    member.setDocument(request.document());
    member.setBirthDate(request.birthDate());
    member.setBaptismDate(request.baptismDate());
    member.setAddress(request.address());
    member.setStatus(MemberStatus.ACTIVE);

    if (request.churchRoleId() != null) {
      ChurchRole churchRole = churchRoleRepository.findByTenantAndId(tenant, request.churchRoleId())
          .orElseThrow(() -> new RuntimeException("Cargo eclesiástico não encontrado"));
      member.setChurchRole(churchRole);
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
    if (request.address() != null) {
      member.setAddress(request.address());
    }
    if (request.status() != null) {
      member.setStatus(request.status());
    }
    if (request.churchRoleId() != null) {
      ChurchRole churchRole = churchRoleRepository.findByTenantAndId(tenant, request.churchRoleId())
          .orElseThrow(() -> new RuntimeException("Cargo eclesiástico não encontrado"));
      member.setChurchRole(churchRole);
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
    return new MemberResponse(
        member.getId(),
        member.getFullName(),
        member.getEmail(),
        member.getPhone(),
        member.getDocument(),
        member.getBirthDate(),
        member.getBaptismDate(),
        member.getAddress(),
        member.getStatus(),
        member.getChurchRole() != null ? member.getChurchRole().getId() : null,
        member.getChurchRole() != null ? member.getChurchRole().getName() : null,
        member.getCreatedAt(),
        member.getUpdatedAt()
    );
  }
}

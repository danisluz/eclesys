package com.eclesys.api.features.dashboard;

import com.eclesys.api.features.users.CurrentUserService;
import com.eclesys.api.domain.member.MemberRepository;
import com.eclesys.api.domain.member.MemberTransferRepository;
import com.eclesys.api.domain.member.TransferStatus;
import com.eclesys.api.domain.member.MemberStatus;
import com.eclesys.api.domain.member.Gender;
import com.eclesys.api.domain.organization.OrganizationUnitRepository;
import com.eclesys.api.domain.organization.OrganizationUnitStatus;
import com.eclesys.api.domain.user.UserRepository;
import com.eclesys.api.domain.tenant.TenantEntity;
import com.eclesys.api.domain.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final MemberRepository memberRepository;
    private final OrganizationUnitRepository organizationRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final MemberTransferRepository transferRepository;
    private final CurrentUserService currentUserService;

    public DashboardStatsDTO getStats() {
        UUID tenantId = currentUserService.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));
        
        DashboardStatsDTO stats = new DashboardStatsDTO();
        
        // Total de membros
        stats.setTotalMembers(memberRepository.countByTenant(tenant));
        
        // Total de organizações
        stats.setTotalOrganizations(organizationRepository.countByTenant(tenant));
        
        // Total de usuários
        stats.setTotalUsers(userRepository.countByTenantId(tenantId));
        
        // Membros cadastrados nos últimos 30 dias
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        stats.setRecentMembersCount(
            memberRepository.countByTenantAndCreatedAtAfter(tenant, thirtyDaysAgo)
        );
        
        // Organizações ativas
        stats.setActiveOrganizations(
            organizationRepository.countByTenantAndStatus(tenant, OrganizationUnitStatus.ACTIVE)
        );
        
        // Transferências por status
        stats.setTransfersPending(
            (long) transferRepository.findByTenantIdAndStatus(tenantId, TransferStatus.PENDING).size()
        );
        stats.setTransfersApproved(
            (long) transferRepository.findByTenantIdAndStatus(tenantId, TransferStatus.APPROVED).size()
        );
        stats.setTransfersRejected(
            (long) transferRepository.findByTenantIdAndStatus(tenantId, TransferStatus.REJECTED).size()
        );
        stats.setTransfersCancelled(
            (long) transferRepository.findByTenantIdAndStatus(tenantId, TransferStatus.CANCELLED).size()
        );
        
        // Membros por status
        stats.setMembersActive(memberRepository.countByTenantAndStatus(tenant, MemberStatus.ACTIVE));
        stats.setMembersInactive(memberRepository.countByTenantAndStatus(tenant, MemberStatus.INACTIVE));
        stats.setMembersTransferred(memberRepository.countByTenantAndStatus(tenant, MemberStatus.TRANSFERRED));
        stats.setMembersDeceased(memberRepository.countByTenantAndStatus(tenant, MemberStatus.DECEASED));
        
        // Membros por gênero
        stats.setMembersMale(memberRepository.countByTenantAndGender(tenant, Gender.M));
        stats.setMembersFemale(memberRepository.countByTenantAndGender(tenant, Gender.F));
        
        // Top 10 organizações por número de membros
        stats.setMembersByOrganization(
            memberRepository.countMembersByOrganization(tenant, PageRequest.of(0, 10))
        );
        
        return stats;
    }
}

package com.eclesys.api.features.dashboard;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class DashboardStatsDTO {
    private Long totalMembers;
    private Long totalOrganizations;
    private Long totalUsers;
    private Long recentMembersCount; // Últimos 30 dias
    private Long activeOrganizations;
    
    // Transferências por status
    private Long transfersPending;
    private Long transfersApproved;
    private Long transfersRejected;
    private Long transfersCancelled;
    
    // Membros por status
    private Long membersActive;
    private Long membersInactive;
    private Long membersTransferred;
    private Long membersDeceased;
    
    // Membros por gênero
    private Long membersMale;
    private Long membersFemale;
    
    // Membros por organização (top 10)
    private List<OrganizationMemberCount> membersByOrganization;
    
    @Data
    public static class OrganizationMemberCount {
        private String organizationName;
        private Long memberCount;
        
        public OrganizationMemberCount(String organizationName, Long memberCount) {
            this.organizationName = organizationName;
            this.memberCount = memberCount;
        }
    }
}

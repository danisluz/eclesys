import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalMembers: number;
  totalOrganizations: number;
  totalUsers: number;
  recentMembersCount: number; // Últimos 30 dias
  activeOrganizations: number;
  // Transferências por status
  transfersPending: number;
  transfersApproved: number;
  transfersRejected: number;
  transfersCancelled: number;
  // Membros por status
  membersActive: number;
  membersInactive: number;
  membersTransferred: number;
  membersDeceased: number;
  // Membros por gênero
  membersMale: number;
  membersFemale: number;
  // Membros por organização
  membersByOrganization: OrganizationMemberCount[];
}

export interface OrganizationMemberCount {
  organizationName: string;
  memberCount: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>('/api/dashboard/stats');
  }
}

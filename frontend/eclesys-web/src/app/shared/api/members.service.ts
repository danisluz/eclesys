import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ApiResponse } from '../../core/auth/models';
import { PageResponse } from '../models/page.model';
import {
  Member,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberStatus,
  TransferMemberRequest,
  MemberTransfer,
} from '../models/member.model';

@Injectable({
  providedIn: 'root',
})
export class MembersService {
  private api = inject(ApiClientService);

  listAll(
    status?: MemberStatus,
    search?: string,
    organizationUnitIds?: string[],
    churchRoleId?: string,
    page: number = 0,
    size: number = 50,
    sortBy: string = 'fullName',
    sortDir: 'asc' | 'desc' = 'asc',
  ): Observable<ApiResponse<PageResponse<Member>>> {
    let path = '/members';
    const params: string[] = [];

    if (status) params.push(`status=${status}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (organizationUnitIds && organizationUnitIds.length > 0) {
      organizationUnitIds.forEach((id) =>
        params.push(`organizationUnitIds=${id}`),
      );
    }
    if (churchRoleId) params.push(`churchRoleId=${churchRoleId}`);
    params.push(`page=${page}`);
    params.push(`size=${size}`);
    params.push(`sortBy=${sortBy}`);
    params.push(`sortDir=${sortDir}`);

    if (params.length > 0) {
      path += '?' + params.join('&');
    }

    return this.api.get<ApiResponse<PageResponse<Member>>>(path);
  }

  getById(id: string): Observable<ApiResponse<Member>> {
    return this.api.get<ApiResponse<Member>>(`/members/${id}`);
  }

  create(request: CreateMemberRequest): Observable<ApiResponse<Member>> {
    return this.api.post<ApiResponse<Member>>('/members', request);
  }

  update(
    id: string,
    request: UpdateMemberRequest,
  ): Observable<ApiResponse<Member>> {
    return this.api.put<ApiResponse<Member>>(`/members/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`/members/${id}`);
  }

  // ==================== TRANSFERÊNCIAS ====================

  transferMember(
    id: string,
    request: TransferMemberRequest,
  ): Observable<ApiResponse<MemberTransfer>> {
    return this.api.post<ApiResponse<MemberTransfer>>(
      `/members/${id}/transfer`,
      request,
    );
  }

  getMemberTransferHistory(
    id: string,
  ): Observable<ApiResponse<MemberTransfer[]>> {
    return this.api.get<ApiResponse<MemberTransfer[]>>(
      `/members/${id}/transfers`,
    );
  }

  getAllTransfers(): Observable<ApiResponse<MemberTransfer[]>> {
    return this.api.get<ApiResponse<MemberTransfer[]>>('/members/transfers');
  }
}

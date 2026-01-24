import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ApiResponse } from '../../core/auth/models';
import {
  Member,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberStatus,
} from '../models/member.model';

@Injectable({
  providedIn: 'root',
})
export class MembersService {
  private api = inject(ApiClientService);

  listAll(
    status?: MemberStatus,
    search?: string,
  ): Observable<ApiResponse<Member[]>> {
    let path = '/members';
    const params: string[] = [];

    if (status) params.push(`status=${status}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);

    if (params.length > 0) {
      path += '?' + params.join('&');
    }

    return this.api.get<ApiResponse<Member[]>>(path);
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
}

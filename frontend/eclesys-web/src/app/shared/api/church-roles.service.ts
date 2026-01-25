import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ApiResponse } from '../../core/auth/models';
import {
  ChurchRole,
  CreateChurchRoleRequest,
  UpdateChurchRoleRequest,
} from '../models/church-role.model';

@Injectable({
  providedIn: 'root',
})
export class ChurchRolesService {
  private api = inject(ApiClientService);

  listAll(activeOnly?: boolean): Observable<ApiResponse<ChurchRole[]>> {
    const path = activeOnly ? '/church-roles?activeOnly=true' : '/church-roles';
    return this.api.get<ApiResponse<ChurchRole[]>>(path);
  }

  getById(id: string): Observable<ApiResponse<ChurchRole>> {
    return this.api.get<ApiResponse<ChurchRole>>(`/church-roles/${id}`);
  }

  create(
    request: CreateChurchRoleRequest,
  ): Observable<ApiResponse<ChurchRole>> {
    return this.api.post<ApiResponse<ChurchRole>>('/church-roles', request);
  }

  update(
    id: string,
    request: UpdateChurchRoleRequest,
  ): Observable<ApiResponse<ChurchRole>> {
    return this.api.put<ApiResponse<ChurchRole>>(
      `/church-roles/${id}`,
      request,
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`/church-roles/${id}`);
  }
}

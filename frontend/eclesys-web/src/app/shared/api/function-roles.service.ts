import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ApiResponse } from '../../core/auth/models';
import {
  FunctionRole,
  CreateFunctionRoleRequest,
  UpdateFunctionRoleRequest,
} from '../models/function-role.model';

@Injectable({
  providedIn: 'root',
})
export class FunctionRolesService {
  private api = inject(ApiClientService);

  listAll(activeOnly?: boolean): Observable<ApiResponse<FunctionRole[]>> {
    const path = activeOnly
      ? '/function-roles?activeOnly=true'
      : '/function-roles';
    return this.api.get<ApiResponse<FunctionRole[]>>(path);
  }

  getById(id: string): Observable<ApiResponse<FunctionRole>> {
    return this.api.get<ApiResponse<FunctionRole>>(`/function-roles/${id}`);
  }

  create(
    request: CreateFunctionRoleRequest,
  ): Observable<ApiResponse<FunctionRole>> {
    return this.api.post<ApiResponse<FunctionRole>>('/function-roles', request);
  }

  update(
    id: string,
    request: UpdateFunctionRoleRequest,
  ): Observable<ApiResponse<FunctionRole>> {
    return this.api.put<ApiResponse<FunctionRole>>(
      `/function-roles/${id}`,
      request,
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`/function-roles/${id}`);
  }
}

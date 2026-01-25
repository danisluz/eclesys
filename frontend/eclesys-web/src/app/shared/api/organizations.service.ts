import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import {
  OrganizationUnit,
  CreateOrganizationUnitRequest,
  UpdateOrganizationUnitRequest,
} from './organization-unit.model';

interface ApiResponse<T> {
  status: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private apiClient = inject(ApiClientService);

  listAll(): Observable<ApiResponse<OrganizationUnit[]>> {
    return this.apiClient.get<ApiResponse<OrganizationUnit[]>>(
      '/organizations',
    );
  }

  getById(id: string): Observable<ApiResponse<OrganizationUnit>> {
    return this.apiClient.get<ApiResponse<OrganizationUnit>>(
      `/organizations/${id}`,
    );
  }

  create(
    request: CreateOrganizationUnitRequest,
  ): Observable<ApiResponse<OrganizationUnit>> {
    return this.apiClient.post<ApiResponse<OrganizationUnit>>(
      '/organizations',
      request,
    );
  }

  update(
    id: string,
    request: UpdateOrganizationUnitRequest,
  ): Observable<ApiResponse<OrganizationUnit>> {
    return this.apiClient.put<ApiResponse<OrganizationUnit>>(
      `/organizations/${id}`,
      request,
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.apiClient.delete<ApiResponse<void>>(`/organizations/${id}`);
  }
}

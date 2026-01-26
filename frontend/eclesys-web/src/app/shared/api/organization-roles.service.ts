import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { ApiResponse } from '../../core/auth/models';

export interface AssignRoleRequest {
  userId: string;
  functionRoleId: string; // UUID do FunctionRole
}

export interface RoleAssignment {
  id: string;
  userId: string;
  userName: string;
  organizationUnitId: string;
  organizationUnitName: string;
  functionRoleId: string;
  functionRoleName: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationRolesService {
  private readonly api = inject(ApiClientService);

  assignRole(
    organizationUnitId: string,
    request: AssignRoleRequest,
  ): Observable<RoleAssignment> {
    return this.api
      .post<
        ApiResponse<RoleAssignment>
      >(`/organizations/${organizationUnitId}/roles`, request)
      .pipe(map((response) => response.data));
  }

  removeRole(
    organizationUnitId: string,
    userId: string,
    functionRoleId: string,
  ): Observable<void> {
    return this.api
      .delete<
        ApiResponse<void>
      >(`/organizations/${organizationUnitId}/roles/${userId}/${functionRoleId}`)
      .pipe(map(() => undefined));
  }

  listRoles(organizationUnitId: string): Observable<RoleAssignment[]> {
    return this.api
      .get<
        ApiResponse<RoleAssignment[]>
      >(`/organizations/${organizationUnitId}/roles`)
      .pipe(map((response) => response.data));
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse } from './models';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface UsersPageResponse {
  items: User[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private httpClient = inject(HttpClient);

  listUsers(
    page: number = 0,
    size: number = 100,
    search?: string,
  ): Observable<ApiResponse<UsersPageResponse>> {
    let url = `/api/users?page=${page}&size=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.httpClient.get<ApiResponse<UsersPageResponse>>(url);
  }

  updateUser(
    userId: string,
    payload: { name: string },
  ): Observable<ApiResponse<any>> {
    return this.httpClient.patch<ApiResponse<any>>(
      `/api/users/${userId}`,
      payload,
    );
  }

  changePassword(
    userId: string,
    payload: { currentPassword: string; newPassword: string },
  ): Observable<ApiResponse<void>> {
    return this.httpClient.patch<ApiResponse<void>>(
      `/api/users/${userId}/password`,
      payload,
    );
  }

  updateMyName(payload: { name: string }) {
    return this.httpClient
      .patch<any>(`/api/users/me`, payload)
      .pipe(map((response) => response.data));
  }
}

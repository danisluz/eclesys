import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse } from './models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private httpClient = inject(HttpClient);

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

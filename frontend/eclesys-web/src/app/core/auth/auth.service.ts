import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoginRequest, LoginResponse } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  httpClient = inject(HttpClient);

  login(request: LoginRequest) {
    const headers = new HttpHeaders({
      'X-Tenant-Code': request.tenantCode,
    });

    const body = {
      email: request.email,
      password: request.password,
    };

    return this.httpClient.post<LoginResponse>(
      '/api/auth/login',
      body,
      { headers }
    );
  }
}

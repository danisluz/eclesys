import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiSuccess, CreateUserRequest, UserDto } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  httpClient = inject(HttpClient);

  async createUser(request: CreateUserRequest): Promise<UserDto> {
    const response = await firstValueFrom(
      this.httpClient.post<ApiSuccess<UserDto>>('/api/users', request)
    );
    return response.data;
  }

  async listUsers(): Promise<UserDto[]> {
    const response = await firstValueFrom(
      this.httpClient.get<any>('/api/users')
    );

    const data = response?.data;

    // 🔒 Backend paginado: data.items é o array correto
    if (Array.isArray(data?.items)) {
      return data.items;
    }

    // fallback (caso backend mude futuramente)
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  }
}

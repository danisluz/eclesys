import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ApiSuccess,
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
} from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  httpClient = inject(HttpClient);

  async createUser(request: CreateUserRequest): Promise<UserDto> {
    const response = await firstValueFrom(
      this.httpClient.post<ApiSuccess<UserDto>>('/api/users', request),
    );
    return response.data;
  }

  async listUsers(): Promise<UserDto[]> {
    const response = await firstValueFrom(
      this.httpClient.get<any>('/api/users'),
    );

    const data = response?.data;

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  }

  async updateUser(
    userId: string,
    payload: UpdateUserRequest,
  ): Promise<UserDto> {
    const response = await firstValueFrom(
      this.httpClient.patch<ApiSuccess<UserDto>>(
        `/api/users/${userId}`,
        payload,
      ),
    );
    return response.data;
  }
}

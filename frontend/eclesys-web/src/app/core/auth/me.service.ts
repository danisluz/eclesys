import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type ApiResponse<T> = { status: 'success' | 'error'; data: T; message: string | null };

@Injectable({ providedIn: 'root' })
export class MeService {
  private httpClient = inject(HttpClient);

  getMe() {
    return this.httpClient.get<ApiResponse<any>>('/api/me');
  }
}

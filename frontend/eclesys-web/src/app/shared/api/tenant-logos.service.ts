import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ApiResponse } from '../../core/auth/models';

export type TenantLogoResponse = {
  logoUrl: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class TenantLogosService {
  private api = inject(ApiClientService);

  uploadLogo(file: File): Observable<ApiResponse<TenantLogoResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<ApiResponse<TenantLogoResponse>>(
      '/tenants/logo',
      formData,
    );
  }

  removeLogo(): Observable<ApiResponse<TenantLogoResponse>> {
    return this.api.delete<ApiResponse<TenantLogoResponse>>('/tenants/logo');
  }
}

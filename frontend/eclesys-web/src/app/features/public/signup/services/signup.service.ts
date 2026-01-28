import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface OnboardingRequest {
  tenantCode: string;
  churchName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  logoUrl: string | null;
  antiBotToken: string | null;
}

export interface ApiSuccess<T> {
  status: 'success';
  data: T;
}

@Injectable({ providedIn: 'root' })
export class SignupService {
  private httpClient = inject(HttpClient);

  create(request: OnboardingRequest) {
    return this.httpClient.post<ApiSuccess<unknown>>(
      '/api/public/onboarding',
      request
    );
  }
}

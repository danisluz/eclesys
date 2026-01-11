import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../shared/api/api-client.service';

export type HealthResponse = { status: string; timestamp: string };
export type PingResponse = { message: string; serverTime: string };
export type VersionResponse = { application: string; version: string; commit: string };

@Injectable({ providedIn: 'root' })
export class SystemApiService {
  apiClientService = inject(ApiClientService);

  getHealth() {
    return this.apiClientService.get<HealthResponse>('/health');
  }

  getPing() {
    return this.apiClientService.get<PingResponse>('/ping');
  }

  getVersion() {
    return this.apiClientService.get<VersionResponse>('/version');
  }
}

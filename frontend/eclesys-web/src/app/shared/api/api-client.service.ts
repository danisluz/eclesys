import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  httpClient = inject(HttpClient);

  buildUrl(path: string) {
    let normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${environment.apiBaseUrl}${normalizedPath}`;
  }

  get<T>(path: string) {
    return this.httpClient.get<T>(this.buildUrl(path));
  }
}

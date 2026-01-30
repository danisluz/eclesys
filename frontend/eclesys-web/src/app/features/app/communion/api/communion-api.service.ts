import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ApiSuccess,
  AttendanceBatchResponse,
  AttendanceRecordResponse,
  AttendanceUpdateItem,
  CommunionBlankListResponse,
  CommunionEvent,
  CommunionEventDetailResponse,
  CommunionEventsFilters,
  CreateCommunionEventRequest,
} from '../models/communion.models';

@Injectable({ providedIn: 'root' })
export class CommunionApiService {
  private httpClient = inject(HttpClient);

  async listEvents(filters: CommunionEventsFilters): Promise<CommunionEvent[]> {
    let params = new HttpParams();

    if (filters.congregationId) {
      params = params.set('congregationId', filters.congregationId);
    }
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    const response = await firstValueFrom(
      this.httpClient.get<ApiSuccess<CommunionEvent[]>>(
        '/api/communions/events',
        { params },
      ),
    );

    return response.data ?? [];
  }

  async createEvent(
    request: CreateCommunionEventRequest,
  ): Promise<CommunionEvent> {
    const response = await firstValueFrom(
      this.httpClient.post<ApiSuccess<CommunionEvent>>(
        '/api/communions/events',
        request,
      ),
    );

    return response.data;
  }

  async openEvent(eventId: string): Promise<CommunionEvent> {
    const response = await firstValueFrom(
      this.httpClient.post<ApiSuccess<CommunionEvent>>(
        `/api/communions/events/${eventId}/open`,
        {},
      ),
    );

    return response.data;
  }

  async closeEvent(eventId: string): Promise<CommunionEvent> {
    const response = await firstValueFrom(
      this.httpClient.post<ApiSuccess<CommunionEvent>>(
        `/api/communions/events/${eventId}/close`,
        {},
      ),
    );

    return response.data;
  }

  async getEvent(eventId: string): Promise<CommunionEventDetailResponse> {
    const response = await firstValueFrom(
      this.httpClient.get<ApiSuccess<CommunionEventDetailResponse>>(
        `/api/communions/events/${eventId}`,
      ),
    );

    return response.data;
  }

  async updateAttendance(
    eventId: string,
    items: AttendanceUpdateItem[],
  ): Promise<AttendanceBatchResponse> {
    const response = await firstValueFrom(
      this.httpClient.patch<ApiSuccess<AttendanceBatchResponse>>(
        `/api/communions/events/${eventId}/attendance`,
        { items },
      ),
    );

    return response.data;
  }

  async markAttendanceByRegistration(
    eventId: string,
    registrationNumber: string,
  ): Promise<AttendanceRecordResponse> {
    const response = await firstValueFrom(
      this.httpClient.post<ApiSuccess<AttendanceRecordResponse>>(
        `/api/communions/events/${eventId}/attendance/by-registration`,
        { registrationNumber },
      ),
    );

    return response.data;
  }

  async getBlankList(eventId: string): Promise<CommunionBlankListResponse> {
    const response = await firstValueFrom(
      this.httpClient.get<ApiSuccess<CommunionBlankListResponse>>(
        `/api/communions/events/${eventId}/blank-list`,
      ),
    );

    return response.data;
  }
}

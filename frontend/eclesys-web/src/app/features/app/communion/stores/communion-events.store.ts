import { computed, inject, Injectable, signal } from '@angular/core';
import { CommunionApiService } from '../api/communion-api.service';
import {
  CommunionEvent,
  CommunionEventListItem,
  CommunionEventStatus,
  CommunionEventsFilters,
  CreateCommunionEventRequest,
} from '../models/communion.models';
import {
  OrganizationUnit,
  OrganizationUnitType,
} from '../../../../shared/api/organization-unit.model';
import { OrganizationsService } from '../../../../shared/api/organizations.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommunionEventsStore {
  private communionApi = inject(CommunionApiService);
  private organizationsService = inject(OrganizationsService);

  eventsSignal = signal<CommunionEvent[]>([]);
  congregationsSignal = signal<OrganizationUnit[]>([]);
  rootChurchSignal = signal<OrganizationUnit | null>(null);

  isLoadingSignal = signal(false);
  isCreatingSignal = signal(false);

  listErrorMessageSignal = signal<string | null>(null);
  createErrorMessageSignal = signal<string | null>(null);

  selectedCongregationIdSignal = signal<string | null>(null);
  selectedStatusSignal = signal<CommunionEventStatus | null>(null);
  dateRangeSignal = signal<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  updatingEventIdsSignal = signal<Set<string>>(new Set());
  exportingEventIdsSignal = signal<Set<string>>(new Set());

  congregationMapSignal = computed(() => {
    const map = new Map<string, string>();
    for (const congregation of this.congregationsSignal()) {
      map.set(congregation.id, congregation.name);
    }
    return map;
  });

  congregationLabelSignal = computed(() => {
    return this.rootChurchSignal()?.congregationLabel ?? 'Congregação';
  });

  congregationLabelPluralSignal = computed(() => {
    return this.toPluralLabel(this.congregationLabelSignal());
  });

  eventsViewSignal = computed<CommunionEventListItem[]>(() => {
    const map = this.congregationMapSignal();
    return this.eventsSignal().map((event) => ({
      ...event,
      congregationName: map.get(event.congregationId) ?? '—',
    }));
  });

  isUpdatingEvent(eventId: string): boolean {
    return this.updatingEventIdsSignal().has(eventId);
  }

  isExportingEvent(eventId: string): boolean {
    return this.exportingEventIdsSignal().has(eventId);
  }

  clearListError(): void {
    this.listErrorMessageSignal.set(null);
  }

  clearCreateError(): void {
    this.createErrorMessageSignal.set(null);
  }

  setSelectedCongregation(congregationId: string | null): void {
    this.selectedCongregationIdSignal.set(congregationId);
  }

  setSelectedStatus(status: CommunionEventStatus | null): void {
    this.selectedStatusSignal.set(status);
  }

  setDateRange(start: Date | null, end: Date | null): void {
    this.dateRangeSignal.set({ start, end });
  }

  clearFilters(): void {
    this.selectedCongregationIdSignal.set(null);
    this.selectedStatusSignal.set(null);
    this.dateRangeSignal.set({ start: null, end: null });
  }

  async loadCongregations(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.organizationsService.listAll(),
      );
      const rootChurch =
        response.data.find((org) => org.type === OrganizationUnitType.CHURCH) ??
        null;
      this.rootChurchSignal.set(rootChurch);
      const congregations = this.flattenCongregations(response.data);
      congregations.sort((a, b) => a.name.localeCompare(b.name));
      this.congregationsSignal.set(congregations);
    } catch {
      this.congregationsSignal.set([]);
      this.rootChurchSignal.set(null);
    }
  }

  async loadEvents(): Promise<void> {
    this.isLoadingSignal.set(true);
    this.listErrorMessageSignal.set(null);

    try {
      const filters = this.buildFilters();
      const events = await this.communionApi.listEvents(filters);
      events.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
      this.eventsSignal.set(events);
    } catch (error: any) {
      this.listErrorMessageSignal.set(
        this.parseErrorMessage(
          error,
          'Não foi possível carregar os eventos de Santa Ceia.',
        ),
      );
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createEvent(
    request: CreateCommunionEventRequest,
  ): Promise<CommunionEvent | null> {
    this.isCreatingSignal.set(true);
    this.createErrorMessageSignal.set(null);

    try {
      const created = await this.communionApi.createEvent(request);
      this.eventsSignal.update((events) => [created, ...events]);
      return created;
    } catch (error: any) {
      this.createErrorMessageSignal.set(
        this.parseErrorMessage(
          error,
          'Não foi possível criar o evento de Santa Ceia.',
        ),
      );
      return null;
    } finally {
      this.isCreatingSignal.set(false);
    }
  }

  async openEvent(eventId: string): Promise<CommunionEvent | null> {
    return this.updateEventStatus(eventId, 'OPEN');
  }

  async closeEvent(eventId: string): Promise<CommunionEvent | null> {
    return this.updateEventStatus(eventId, 'CLOSED');
  }

  async exportBlankListPdf(
    eventId: string,
  ): Promise<{ blob: Blob | null; errorMessage?: string }> {
    this.markExporting(eventId, true);

    try {
      const blob = await this.communionApi.getBlankListPdf(eventId);
      return { blob };
    } catch (error: any) {
      const message = await this.parseBlobErrorMessage(
        error,
        'Não foi possível exportar a lista em branco.',
      );
      return { blob: null, errorMessage: message };
    } finally {
      this.markExporting(eventId, false);
    }
  }

  private async updateEventStatus(
    eventId: string,
    nextStatus: CommunionEventStatus,
  ): Promise<CommunionEvent | null> {
    this.markUpdating(eventId, true);

    try {
      const updated =
        nextStatus === 'OPEN'
          ? await this.communionApi.openEvent(eventId)
          : await this.communionApi.closeEvent(eventId);

      this.eventsSignal.update((events) =>
        events.map((event) =>
          event.id === eventId ? updated : event,
        ),
      );
      return updated;
    } catch (error: any) {
      return null;
    } finally {
      this.markUpdating(eventId, false);
    }
  }

  private markUpdating(eventId: string, isUpdating: boolean): void {
    this.updatingEventIdsSignal.update((current) => {
      const next = new Set(current);
      if (isUpdating) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      return next;
    });
  }

  private markExporting(eventId: string, isExporting: boolean): void {
    this.exportingEventIdsSignal.update((current) => {
      const next = new Set(current);
      if (isExporting) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      return next;
    });
  }

  private buildFilters(): CommunionEventsFilters {
    const dateRange = this.dateRangeSignal();
    return {
      congregationId: this.selectedCongregationIdSignal(),
      status: this.selectedStatusSignal(),
      from: dateRange.start ? this.formatDateOnly(dateRange.start) : null,
      to: dateRange.end ? this.formatDateOnly(dateRange.end) : null,
    };
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private flattenCongregations(
    units: OrganizationUnit[],
  ): OrganizationUnit[] {
    const result: OrganizationUnit[] = [];

    for (const unit of units) {
      if (unit.type === OrganizationUnitType.CONGREGATION) {
        result.push(unit);
      }
      if (unit.children && unit.children.length > 0) {
        result.push(...this.flattenCongregations(unit.children));
      }
    }

    return result;
  }

  private toPluralLabel(label: string): string {
    if (!label) return 'Congregações';
    if (label.endsWith('ão')) {
      return label.slice(0, -2) + 'ões';
    }
    return label + 's';
  }

  private parseErrorMessage(error: any, fallbackMessage: string): string {
    const apiMessage = error?.error?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    return fallbackMessage;
  }

  private async parseBlobErrorMessage(
    error: any,
    fallbackMessage: string,
  ): Promise<string> {
    const apiMessage = error?.error?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }

    const blob = error?.error;
    if (blob instanceof Blob) {
      try {
        const text = await blob.text();
        const parsed = JSON.parse(text);
        if (typeof parsed?.message === 'string' && parsed.message.trim()) {
          return parsed.message;
        }
      } catch {
        // fallback abaixo
      }
    }

    return fallbackMessage;
  }
}

import { computed, inject, Injectable, signal } from '@angular/core';
import { CommunionApiService } from '../api/communion-api.service';
import {
  AttendanceRecordResponse,
  AttendanceStatus,
  AttendanceUpdateItem,
  CommunionEvent,
  CommunionMemberAttendance,
} from '../models/communion.models';
import { OrganizationsService } from '../../../../shared/api/organizations.service';
import {
  OrganizationUnit,
  OrganizationUnitType,
} from '../../../../shared/api/organization-unit.model';
import { firstValueFrom } from 'rxjs';

interface AttendanceOverride {
  status: AttendanceStatus;
  note: string | null;
}

@Injectable({ providedIn: 'root' })
export class CommunionEventDetailStore {
  private communionApi = inject(CommunionApiService);
  private organizationsService = inject(OrganizationsService);

  eventSignal = signal<CommunionEvent | null>(null);

  // Base list: fixed after load, reflects the last saved state
  private membersBaseSignal = signal<CommunionMemberAttendance[]>([]);

  // Only the pending changes made since last save
  private overridesSignal = signal<Record<string, AttendanceOverride>>({});

  congregationNameSignal = signal<string | null>(null);
  rootChurchSignal = signal<OrganizationUnit | null>(null);

  isLoadingSignal = signal(false);
  isSavingSignal = signal(false);
  isStatusUpdatingSignal = signal(false);
  isMarkingByRegistrationSignal = signal(false);
  isExportingSignal = signal(false);

  errorMessageSignal = signal<string | null>(null);

  memberSearchTermSignal = signal('');
  showOnlyPresentSignal = signal(false);

  private initialStatusMapSignal = signal<Map<string, AttendanceStatus>>(new Map());
  private initialNoteMapSignal = signal<Map<string, string | null>>(new Map());

  sortStateSignal = signal<{
    active: 'registrationNumber' | 'fullName' | 'status';
    direction: 'asc' | 'desc';
  }>({ active: 'fullName', direction: 'asc' });

  // Public: base + overrides merged
  membersSignal = computed(() => {
    const base = this.membersBaseSignal();
    const overrides = this.overridesSignal();
    if (Object.keys(overrides).length === 0) return base;
    return base.map((m) => {
      const o = overrides[m.memberId];
      return o
        ? { ...m, status: o.status, present: o.status === 'PRESENT', note: o.note }
        : m;
    });
  });

  isEditingLockedSignal = computed(() => this.eventSignal()?.status !== 'OPEN');
  isClosedSignal = computed(() => this.eventSignal()?.status === 'CLOSED');

  congregationLabelSignal = computed(
    () => this.rootChurchSignal()?.congregationLabel ?? 'Congregação',
  );

  notesEnabledSignal = computed(() =>
    this.membersBaseSignal().some((m) => 'note' in m),
  );

  attendanceSummarySignal = computed(() => {
    const base = this.membersBaseSignal();
    const overrides = this.overridesSignal();
    let present = 0,
      absent = 0,
      justified = 0;

    for (const m of base) {
      const status =
        overrides[m.memberId]?.status ?? m.status ?? (m.present ? 'PRESENT' : 'ABSENT');
      if (status === 'PRESENT') present++;
      else if (status === 'JUSTIFIED') justified++;
      else absent++;
    }

    return { total: base.length, present, absent, justified };
  });

  // Sort by name/registration depends only on base — NOT invalidated by overrides (key optimization)
  // Sort by status needs combined data and will re-sort on every change (acceptable: user chose that view)
  private membersSortedSignal = computed(() => {
    const { active, direction } = this.sortStateSignal();
    const multiplier = direction === 'desc' ? -1 : 1;

    if (active === 'status') {
      const combined = this.membersSignal();
      return [...combined].sort(
        (a, b) =>
          multiplier *
          (this.getStatusOrder(this.resolveStatus(a)) -
            this.getStatusOrder(this.resolveStatus(b))),
      );
    }

    const base = [...this.membersBaseSignal()];
    base.sort((a, b) => {
      if (active === 'registrationNumber') {
        return multiplier * a.registrationNumber.localeCompare(b.registrationNumber);
      }
      return multiplier * a.fullName.localeCompare(b.fullName, 'pt-BR', { sensitivity: 'base' });
    });
    return base;
  });

  private filteredBaseSignal = computed(() => {
    const term = this.memberSearchTermSignal().trim().toLowerCase();
    const sorted = this.membersSortedSignal();
    if (!term) return sorted;
    return sorted.filter(
      (m) =>
        m.fullName.toLowerCase().includes(term) ||
        m.registrationNumber.toLowerCase().includes(term),
    );
  });

  // Applies overrides to the filtered+sorted base list — only this computed is invalidated on P/A/J clicks (default sort)
  tableMembersSignal = computed(() => {
    const filtered = this.filteredBaseSignal();
    const overrides = this.overridesSignal();
    const hasOverrides = Object.keys(overrides).length > 0;
    const showOnly = this.showOnlyPresentSignal();

    const members = hasOverrides
      ? filtered.map((m) => {
          const o = overrides[m.memberId];
          return o
            ? { ...m, status: o.status, present: o.status === 'PRESENT', note: o.note }
            : m;
        })
      : filtered;

    return showOnly ? members.filter((m) => m.present) : members;
  });

  // O(overrides.size) instead of O(all members)
  pendingChangesCountSignal = computed(() => {
    const overrides = this.overridesSignal();
    const initialStatus = this.initialStatusMapSignal();
    const initialNotes = this.initialNoteMapSignal();
    const notesEnabled = this.notesEnabledSignal();

    let count = 0;
    for (const [memberId, override] of Object.entries(overrides)) {
      if (initialStatus.get(memberId) !== override.status) {
        count++;
        continue;
      }
      if (notesEnabled && (initialNotes.get(memberId) ?? null) !== (override.note ?? null)) {
        count++;
      }
    }
    return count;
  });

  async loadEvent(eventId: string): Promise<void> {
    await Promise.resolve();
    this.isLoadingSignal.set(true);
    this.errorMessageSignal.set(null);
    this.memberSearchTermSignal.set('');
    this.showOnlyPresentSignal.set(false);
    this.eventSignal.set(null);
    this.membersBaseSignal.set([]);
    this.overridesSignal.set({});
    this.congregationNameSignal.set(null);

    try {
      const response = await this.communionApi.getEvent(eventId);
      this.eventSignal.set(response.event);
      const members = response.members.map((m) => this.normalizeMember(m));
      this.membersBaseSignal.set(members);
      await Promise.all([
        this.loadCongregationName(response.event.congregationId),
        this.loadOrganizationLabels(),
      ]);
      this.initialStatusMapSignal.set(
        new Map(members.map((m) => [m.memberId, this.resolveStatus(m)])),
      );
      this.initialNoteMapSignal.set(
        new Map(members.map((m) => [m.memberId, m.note ?? null])),
      );
    } catch (error: any) {
      this.errorMessageSignal.set(
        this.parseErrorMessage(error, 'Não foi possível carregar o evento de Santa Ceia.'),
      );
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  private async loadCongregationName(congregationId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.organizationsService.getById(congregationId));
      this.congregationNameSignal.set(response.data?.name ?? null);
    } catch {
      this.congregationNameSignal.set(null);
    }
  }

  private async loadOrganizationLabels(): Promise<void> {
    if (this.rootChurchSignal()) return;
    try {
      const response = await firstValueFrom(this.organizationsService.listAll());
      const rootChurch =
        response.data.find((org) => org.type === OrganizationUnitType.CHURCH) ?? null;
      this.rootChurchSignal.set(rootChurch);
    } catch {
      this.rootChurchSignal.set(null);
    }
  }

  setMemberSearchTerm(term: string): void {
    this.memberSearchTermSignal.set(term);
  }

  setSort(
    active: 'registrationNumber' | 'fullName' | 'status',
    direction: 'asc' | 'desc' | '',
  ): void {
    this.sortStateSignal.set({ active, direction: direction === '' ? 'asc' : direction });
  }

  setShowOnlyPresent(onlyPresent: boolean): void {
    this.showOnlyPresentSignal.set(onlyPresent);
  }

  // O(overrides.size) update — no full array scan
  updateAttendanceStatus(memberId: string, status: AttendanceStatus): void {
    const baseNote =
      this.membersBaseSignal().find((m) => m.memberId === memberId)?.note ?? null;
    const prevOverride = this.overridesSignal()[memberId];

    this.overridesSignal.update((prev) => ({
      ...prev,
      [memberId]: {
        status,
        note: status === 'JUSTIFIED' ? (prevOverride?.note ?? baseNote) : null,
      },
    }));
  }

  updateNote(memberId: string, note: string | null): void {
    const current = this.overridesSignal()[memberId];
    if (!current) return;
    this.overridesSignal.update((prev) => ({
      ...prev,
      [memberId]: { ...current, note },
    }));
  }

  async savePendingChanges(): Promise<number> {
    const event = this.eventSignal();
    if (!event) return 0;

    const items = this.collectPendingChanges();
    if (items.length === 0) return 0;

    this.isSavingSignal.set(true);
    this.errorMessageSignal.set(null);

    try {
      const result = await this.communionApi.updateAttendance(event.id, items);
      this.applyPresenceSnapshot();
      return result.updatedCount ?? items.length;
    } catch (error: any) {
      this.errorMessageSignal.set(
        this.parseErrorMessage(error, 'Não foi possível salvar as presenças.'),
      );
      return 0;
    } finally {
      this.isSavingSignal.set(false);
    }
  }

  async markAttendanceByRegistration(
    registrationNumber: string,
  ): Promise<AttendanceRecordResponse | null> {
    const event = this.eventSignal();
    if (!event) return null;

    this.isMarkingByRegistrationSignal.set(true);
    this.errorMessageSignal.set(null);

    try {
      const record = await this.communionApi.markAttendanceByRegistration(
        event.id,
        registrationNumber,
      );
      const updated = this.applyAttendanceRecord(record);
      if (!updated) {
        await this.loadEvent(event.id);
      }
      return record;
    } catch (error: any) {
      this.errorMessageSignal.set(
        this.parseErrorMessage(error, 'Não foi possível registrar a presença.'),
      );
      return null;
    } finally {
      this.isMarkingByRegistrationSignal.set(false);
    }
  }

  async openEvent(): Promise<CommunionEvent | null> {
    return this.updateEventStatus('OPEN');
  }

  async closeEvent(): Promise<CommunionEvent | null> {
    return this.updateEventStatus('CLOSED');
  }

  async exportBlankList(): Promise<Blob | null> {
    const event = this.eventSignal();
    if (!event) return null;

    this.isExportingSignal.set(true);
    this.errorMessageSignal.set(null);

    try {
      return await this.communionApi.getBlankListPdf(event.id);
    } catch (error: any) {
      this.errorMessageSignal.set(
        this.parseErrorMessage(error, 'Não foi possível exportar a lista em branco.'),
      );
      return null;
    } finally {
      this.isExportingSignal.set(false);
    }
  }

  private collectPendingChanges(): AttendanceUpdateItem[] {
    const overrides = this.overridesSignal();
    const initialStatus = this.initialStatusMapSignal();
    const initialNotes = this.initialNoteMapSignal();
    const notesEnabled = this.notesEnabledSignal();

    return Object.entries(overrides)
      .filter(([memberId, override]) => {
        if (initialStatus.get(memberId) !== override.status) return true;
        if (!notesEnabled) return false;
        return (initialNotes.get(memberId) ?? null) !== (override.note ?? null);
      })
      .map(([memberId, override]) => {
        const item: AttendanceUpdateItem = {
          memberId,
          present: override.status === 'PRESENT',
          status: override.status,
        };
        if (notesEnabled) {
          const initNote = initialNotes.get(memberId) ?? null;
          if (initNote !== (override.note ?? null)) {
            item.note = override.note;
          }
        }
        return item;
      });
  }

  private applyPresenceSnapshot(): void {
    const overrides = this.overridesSignal();
    if (Object.keys(overrides).length > 0) {
      this.membersBaseSignal.update((members) =>
        members.map((m) => {
          const o = overrides[m.memberId];
          return o
            ? { ...m, status: o.status, present: o.status === 'PRESENT', note: o.note }
            : m;
        }),
      );
    }
    this.overridesSignal.set({});

    const updated = this.membersBaseSignal();
    this.initialStatusMapSignal.set(
      new Map(updated.map((m) => [m.memberId, this.resolveStatus(m)])),
    );
    this.initialNoteMapSignal.set(
      new Map(updated.map((m) => [m.memberId, m.note ?? null])),
    );
  }

  private applyAttendanceRecord(record: AttendanceRecordResponse): boolean {
    const exists = this.membersBaseSignal().some((m) => m.memberId === record.memberId);
    if (!exists) return false;

    const status = record.status ?? (record.present ? 'PRESENT' : 'ABSENT');

    this.membersBaseSignal.update((members) =>
      members.map((m) =>
        m.memberId === record.memberId
          ? { ...m, present: record.present, status, note: record.note ?? m.note ?? null }
          : m,
      ),
    );

    // Remove from overrides — this record is now persisted
    this.overridesSignal.update((prev) => {
      const next = { ...prev };
      delete next[record.memberId];
      return next;
    });

    const statusMap = new Map(this.initialStatusMapSignal());
    statusMap.set(record.memberId, status);
    this.initialStatusMapSignal.set(statusMap);

    if (this.notesEnabledSignal() && record.note !== undefined) {
      const noteMap = new Map(this.initialNoteMapSignal());
      noteMap.set(record.memberId, record.note ?? null);
      this.initialNoteMapSignal.set(noteMap);
    }

    return true;
  }

  private async updateEventStatus(
    nextStatus: 'OPEN' | 'CLOSED',
  ): Promise<CommunionEvent | null> {
    const event = this.eventSignal();
    if (!event) return null;

    this.isStatusUpdatingSignal.set(true);
    this.errorMessageSignal.set(null);

    try {
      const updated =
        nextStatus === 'OPEN'
          ? await this.communionApi.openEvent(event.id)
          : await this.communionApi.closeEvent(event.id);
      this.eventSignal.set(updated);
      return updated;
    } catch (error: any) {
      this.errorMessageSignal.set(
        this.parseErrorMessage(error, 'Não foi possível atualizar o status do evento.'),
      );
      return null;
    } finally {
      this.isStatusUpdatingSignal.set(false);
    }
  }

  private parseErrorMessage(error: any, fallbackMessage: string): string {
    const apiMessage = error?.error?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    return fallbackMessage;
  }

  private resolveStatus(member: CommunionMemberAttendance): AttendanceStatus {
    return member.status ?? (member.present ? 'PRESENT' : 'ABSENT');
  }

  private getStatusOrder(status: AttendanceStatus): number {
    switch (status) {
      case 'PRESENT':
        return 0;
      case 'JUSTIFIED':
        return 1;
      case 'ABSENT':
      default:
        return 2;
    }
  }

  private normalizeMember(member: CommunionMemberAttendance): CommunionMemberAttendance {
    return { ...member, status: member.status ?? (member.present ? 'PRESENT' : 'ABSENT') };
  }
}

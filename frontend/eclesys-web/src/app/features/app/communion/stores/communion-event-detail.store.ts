import { computed, inject, Injectable, signal } from '@angular/core';
import { CommunionApiService } from '../api/communion-api.service';
import {
  AttendanceRecordResponse,
  AttendanceStatus,
  AttendanceUpdateItem,
  CommunionBlankListResponse,
  CommunionEvent,
  CommunionMemberAttendance,
} from '../models/communion.models';
import { OrganizationsService } from '../../../../shared/api/organizations.service';
import {
  OrganizationUnit,
  OrganizationUnitType,
} from '../../../../shared/api/organization-unit.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommunionEventDetailStore {
  private communionApi = inject(CommunionApiService);
  private organizationsService = inject(OrganizationsService);

  eventSignal = signal<CommunionEvent | null>(null);
  membersSignal = signal<CommunionMemberAttendance[]>([]);
  membersOriginalSignal = signal<CommunionMemberAttendance[]>([]);
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

  private initialPresenceMapSignal = signal<Map<string, boolean>>(new Map());
  private initialNoteMapSignal = signal<Map<string, string | null>>(new Map());
  private initialStatusMapSignal = signal<Map<string, AttendanceStatus>>(new Map());

  isEditingLockedSignal = computed(
    () => this.eventSignal()?.status !== 'OPEN',
  );
  isClosedSignal = computed(() => this.eventSignal()?.status === 'CLOSED');
  congregationLabelSignal = computed(() => {
    return this.rootChurchSignal()?.congregationLabel ?? 'Congregação';
  });
  notesEnabledSignal = computed(() => {
    return this.membersOriginalSignal().some((member) => 'note' in member);
  });

  membersSortedSignal = computed(() => {
    const members = [...this.membersSignal()];
    members.sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'pt-BR', { sensitivity: 'base' }),
    );
    return members;
  });

  filteredMembersSignal = computed(() => {
    const term = this.memberSearchTermSignal().trim().toLowerCase();
    const baseList = this.membersSortedSignal();
    if (!term) return baseList;

    return baseList.filter((member) => {
      const name = member.fullName.toLowerCase();
      const registration = member.registrationNumber.toLowerCase();
      return name.includes(term) || registration.includes(term);
    });
  });

  tableMembersSignal = computed(() => {
    const filtered = this.filteredMembersSignal();
    if (!this.showOnlyPresentSignal()) return filtered;
    return filtered.filter((member) => member.present);
  });

  pendingChangesCountSignal = computed(() => {
    const initialPresence = this.initialPresenceMapSignal();
    const initialNotes = this.initialNoteMapSignal();
    const initialStatus = this.initialStatusMapSignal();
    const notesEnabled = this.notesEnabledSignal();
    return this.membersSignal().reduce((count, member) => {
      const initialValue = initialPresence.get(member.memberId);
      if (initialValue === undefined) return count;
      const statusChanged =
        initialStatus.get(member.memberId) !== this.getStatus(member);
      const presenceChanged = initialValue !== member.present;
      if (statusChanged || presenceChanged) return count + 1;

      if (!notesEnabled) return count;

      const initialNote = initialNotes.get(member.memberId) ?? null;
      const currentNote = member.note ?? null;
      return initialNote !== currentNote ? count + 1 : count;
    }, 0);
  });

  async loadEvent(eventId: string): Promise<void> {
    this.isLoadingSignal.set(true);
    this.errorMessageSignal.set(null);
    this.memberSearchTermSignal.set('');
    this.showOnlyPresentSignal.set(false);

    try {
      const response = await this.communionApi.getEvent(eventId);
      this.eventSignal.set(response.event);
      const members = response.members.map((member) => this.normalizeMember(member));
      this.membersSignal.set(members);
      this.membersOriginalSignal.set(this.cloneMembers(members));
      this.congregationNameSignal.set(null);
      await Promise.all([
        this.loadCongregationName(response.event.congregationId),
        this.loadOrganizationLabels(),
      ]);
      this.initialPresenceMapSignal.set(
        new Map(
          members.map((member) => [member.memberId, member.present]),
        ),
      );
      this.initialNoteMapSignal.set(
        new Map(
          members.map((member) => [member.memberId, member.note ?? null]),
        ),
      );
      this.initialStatusMapSignal.set(
        new Map(
          members.map((member) => [member.memberId, this.getStatus(member)]),
        ),
      );
    } catch (error: any) {
      this.errorMessageSignal.set(
        this.parseErrorMessage(
          error,
          'Não foi possível carregar o evento de Santa Ceia.',
        ),
      );
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  private async loadCongregationName(congregationId: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.organizationsService.getById(congregationId),
      );
      this.congregationNameSignal.set(response.data?.name ?? null);
    } catch {
      this.congregationNameSignal.set(null);
    }
  }

  private async loadOrganizationLabels(): Promise<void> {
    if (this.rootChurchSignal()) return;

    try {
      const response = await firstValueFrom(
        this.organizationsService.listAll(),
      );
      const rootChurch =
        response.data.find((org) => org.type === OrganizationUnitType.CHURCH) ??
        null;
      this.rootChurchSignal.set(rootChurch);
    } catch {
      this.rootChurchSignal.set(null);
    }
  }

  setMemberSearchTerm(term: string): void {
    this.memberSearchTermSignal.set(term);
  }

  setShowOnlyPresent(onlyPresent: boolean): void {
    this.showOnlyPresentSignal.set(onlyPresent);
  }

  updatePresence(memberId: string, present: boolean): void {
    const status: AttendanceStatus = present ? 'PRESENT' : 'ABSENT';
    this.membersSignal.update((members) =>
      members.map((member) =>
        member.memberId === memberId
          ? {
              ...member,
              present,
              status,
              note: null,
            }
          : member,
      ),
    );
  }

  updateAttendanceStatus(memberId: string, status: AttendanceStatus): void {
    const present = status === 'PRESENT';
    this.membersSignal.update((members) =>
      members.map((member) =>
        member.memberId === memberId
          ? {
              ...member,
              status,
              present,
              note: status === 'JUSTIFIED' ? member.note ?? null : null,
            }
          : member,
      ),
    );
  }

  updateNote(memberId: string, note: string | null): void {
    this.membersSignal.update((members) =>
      members.map((member) =>
        member.memberId === memberId ? { ...member, note } : member,
      ),
    );
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
        this.parseErrorMessage(
          error,
          'Não foi possível salvar as presenças.',
        ),
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
        this.parseErrorMessage(
          error,
          'Não foi possível registrar a presença.',
        ),
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

  async exportBlankList(): Promise<CommunionBlankListResponse | null> {
    const event = this.eventSignal();
    if (!event) return null;

    this.isExportingSignal.set(true);
    this.errorMessageSignal.set(null);

    try {
      return await this.communionApi.getBlankList(event.id);
    } catch (error: any) {
      this.errorMessageSignal.set(
        this.parseErrorMessage(
          error,
          'Não foi possível exportar a lista em branco.',
        ),
      );
      return null;
    } finally {
      this.isExportingSignal.set(false);
    }
  }

  private collectPendingChanges(): AttendanceUpdateItem[] {
    const initialPresence = this.initialPresenceMapSignal();
    const initialNotes = this.initialNoteMapSignal();
    const initialStatus = this.initialStatusMapSignal();
    const notesEnabled = this.notesEnabledSignal();
    return this.membersSignal()
      .filter((member) => {
        const statusChanged =
          initialStatus.get(member.memberId) !== this.getStatus(member);
        const presenceChanged =
          initialPresence.get(member.memberId) !== member.present;
        if (statusChanged || presenceChanged) return true;
        if (!notesEnabled) return false;
        const initialNote = initialNotes.get(member.memberId) ?? null;
        const currentNote = member.note ?? null;
        return initialNote !== currentNote;
      })
      .map((member) => {
        const status = this.getStatus(member);
        const item: AttendanceUpdateItem = {
          memberId: member.memberId,
          present: status === 'PRESENT',
          status,
        };
        if (notesEnabled) {
          const initialNote = initialNotes.get(member.memberId) ?? null;
          const currentNote = member.note ?? null;
          if (initialNote !== currentNote) {
            item.note = currentNote;
          }
        }
        return item;
      });
  }

  private applyPresenceSnapshot(): void {
    const map = new Map<string, boolean>();
    const noteMap = new Map<string, string | null>();
    const statusMap = new Map<string, AttendanceStatus>();
    for (const member of this.membersSignal()) {
      map.set(member.memberId, member.present);
      noteMap.set(member.memberId, member.note ?? null);
      statusMap.set(member.memberId, this.getStatus(member));
    }
    this.initialPresenceMapSignal.set(map);
    this.initialNoteMapSignal.set(noteMap);
    this.initialStatusMapSignal.set(statusMap);
    this.membersOriginalSignal.set(this.cloneMembers(this.membersSignal()));
  }

  private applyAttendanceRecord(record: AttendanceRecordResponse): boolean {
    let updated = false;

    this.membersSignal.update((members) =>
      members.map((member) => {
        if (member.memberId !== record.memberId) {
          return member;
        }
        updated = true;
        const status = record.status ?? (record.present ? 'PRESENT' : 'ABSENT');
        return {
          ...member,
          present: record.present,
          status,
          note: record.note ?? member.note ?? null,
        };
      }),
    );

    if (updated) {
      const initial = new Map(this.initialPresenceMapSignal());
      initial.set(record.memberId, record.present);
      this.initialPresenceMapSignal.set(initial);

      const statusMap = new Map(this.initialStatusMapSignal());
      const status = record.status ?? (record.present ? 'PRESENT' : 'ABSENT');
      statusMap.set(record.memberId, status);
      this.initialStatusMapSignal.set(statusMap);

      if (this.notesEnabledSignal()) {
        const initialNotes = new Map(this.initialNoteMapSignal());
        if (record.note !== undefined) {
          initialNotes.set(record.memberId, record.note ?? null);
          this.initialNoteMapSignal.set(initialNotes);
        }
      }
    }

    return updated;
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
        this.parseErrorMessage(
          error,
          'Não foi possível atualizar o status do evento.',
        ),
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

  private cloneMembers(
    members: CommunionMemberAttendance[],
  ): CommunionMemberAttendance[] {
    return members.map((member) => ({ ...member }));
  }

  private getStatus(member: CommunionMemberAttendance): AttendanceStatus {
    return member.status ?? (member.present ? 'PRESENT' : 'ABSENT');
  }

  private normalizeMember(
    member: CommunionMemberAttendance,
  ): CommunionMemberAttendance {
    const status = member.status ?? (member.present ? 'PRESENT' : 'ABSENT');
    return { ...member, status };
  }
}

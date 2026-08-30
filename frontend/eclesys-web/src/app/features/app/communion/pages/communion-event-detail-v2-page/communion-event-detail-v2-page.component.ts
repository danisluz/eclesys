import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Dialog } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { AppConfirmService } from '../../../../../core/services/app-confirm.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { CommunionEventDetailStore } from '../../stores/communion-event-detail.store';
import {
  AttendanceStatus,
  CommunionMemberAttendance,
} from '../../models/communion.models';

@Component({
  selector: 'app-communion-event-detail-v2-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    Dialog,
    SelectButtonModule,
    ToggleSwitchModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './communion-event-detail-v2-page.component.html',
  styleUrl: './communion-event-detail-v2-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunionEventDetailV2PageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmService = inject(AppConfirmService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly detailStore = inject(CommunionEventDetailStore);

  readonly registrationInputSignal = signal('');
  readonly isAutoSavingSignal = signal(false);
  readonly noteDialogVisibleSignal = signal(false);
  readonly noteDraftSignal = signal('');
  readonly noteMemberSignal = signal<CommunionMemberAttendance | null>(null);

  readonly attendanceOptions: { label: string; value: AttendanceStatus }[] = [
    { label: 'P', value: 'PRESENT' },
    { label: 'A', value: 'ABSENT' },
    { label: 'J', value: 'JUSTIFIED' },
  ];

  constructor() {
    toObservable(this.detailStore.pendingChangesCountSignal)
      .pipe(
        distinctUntilChanged(),
        debounceTime(3000),
        filter(
          (count) =>
            count > 0 &&
            !this.detailStore.isSavingSignal() &&
            this.detailStore.eventSignal()?.status === 'OPEN',
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        void this.autoSave();
      });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('eventId')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((eventId: string | null) => {
        if (!eventId) {
          void this.router.navigate(['/app/santa-ceia/v2']);
          return;
        }

        void this.detailStore.loadEvent(eventId);
      });
  }

  goBack(): void {
    void this.router.navigate(['/app/santa-ceia/v2']);
  }

  formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
  }

  getStatusLabel(status: string | undefined): string {
    if (status === 'OPEN') return 'Em andamento';
    if (status === 'CLOSED') return 'Encerrado';
    return 'Rascunho';
  }

  getStatusSeverity(
    status: string | undefined,
  ): 'success' | 'secondary' | 'info' {
    if (status === 'OPEN') return 'success';
    if (status === 'CLOSED') return 'secondary';
    return 'info';
  }

  getAttendanceStatus(member: CommunionMemberAttendance): AttendanceStatus {
    return member.status ?? (member.present ? 'PRESENT' : 'ABSENT');
  }

  onAttendanceChange(
    member: CommunionMemberAttendance,
    value: AttendanceStatus | null,
  ): void {
    if (!value) return;
    this.detailStore.updateAttendanceStatus(member.memberId, value);
  }

  toggleSort(active: 'registrationNumber' | 'fullName' | 'status'): void {
    const current = this.detailStore.sortStateSignal();
    const nextDirection =
      current.active === active && current.direction === 'asc' ? 'desc' : 'asc';
    this.detailStore.setSort(active, nextDirection);
  }

  sortIcon(active: 'registrationNumber' | 'fullName' | 'status'): string {
    const current = this.detailStore.sortStateSignal();
    if (current.active !== active) return 'pi pi-sort-alt';
    return current.direction === 'asc'
      ? 'pi pi-sort-amount-up'
      : 'pi pi-sort-amount-down';
  }

  onMemberSearch(term: string): void {
    this.detailStore.setMemberSearchTerm(term);
  }

  clearSearch(searchInput: HTMLInputElement): void {
    this.detailStore.setMemberSearchTerm('');
    searchInput.value = '';
    searchInput.focus();
  }

  async onRegistrationSubmit(input: HTMLInputElement): Promise<void> {
    const registrationNumber = this.registrationInputSignal().trim();
    if (!registrationNumber) return;

    const record = await this.detailStore.markAttendanceByRegistration(
      registrationNumber,
    );

    if (!record) {
      if (this.detailStore.errorMessageSignal()) {
        this.notificationService.error(this.detailStore.errorMessageSignal()!);
      }
      return;
    }

    const memberName =
      this.detailStore
        .membersSignal()
        .find((member) => member.memberId === record.memberId)?.fullName ??
      registrationNumber;

    this.notificationService.success(`Presença registrada: ${memberName}`);
    this.registrationInputSignal.set('');
    input.value = '';
    input.focus();
  }

  openNoteDialog(member: CommunionMemberAttendance): void {
    if (this.getAttendanceStatus(member) !== 'JUSTIFIED') return;

    this.noteMemberSignal.set(member);
    this.noteDraftSignal.set(member.note ?? '');
    this.noteDialogVisibleSignal.set(true);
  }

  closeNoteDialog(): void {
    this.noteDialogVisibleSignal.set(false);
    this.noteMemberSignal.set(null);
    this.noteDraftSignal.set('');
  }

  saveNote(): void {
    const member = this.noteMemberSignal();
    if (!member) return;

    const value = this.noteDraftSignal().trim();
    this.detailStore.updateNote(member.memberId, value.length > 0 ? value : null);
    this.closeNoteDialog();
  }

  async saveChanges(): Promise<void> {
    const updatedCount = await this.detailStore.savePendingChanges();
    if (updatedCount > 0) {
      this.notificationService.success('Presenças salvas com sucesso');
    } else if (this.detailStore.errorMessageSignal()) {
      this.notificationService.error(this.detailStore.errorMessageSignal()!);
    }
  }

  openEvent(): void {
    this.confirmService.confirm({
      header: 'Abrir evento',
      message: 'Deseja abrir este evento de Santa Ceia?',
      accept: async () => {
        const updated = await this.detailStore.openEvent();
        if (updated) {
          this.notificationService.success('Evento aberto com sucesso');
        } else if (this.detailStore.errorMessageSignal()) {
          this.notificationService.error(this.detailStore.errorMessageSignal()!);
        }
      },
    });
  }

  closeEvent(): void {
    this.confirmService.confirm({
      header: 'Fechar evento',
      message:
        'Deseja fechar este evento? Após fechado, não será possível editar presenças.',
      accept: async () => {
        const updated = await this.detailStore.closeEvent();
        if (updated) {
          this.notificationService.success('Evento fechado com sucesso');
        } else if (this.detailStore.errorMessageSignal()) {
          this.notificationService.error(this.detailStore.errorMessageSignal()!);
        }
      },
    });
  }

  exportBlankList(): void {
    this.confirmService.confirm({
      header: 'Exportar lista',
      message: 'Deseja gerar o PDF para uso no modo manual?',
      accept: async () => {
        const blob = await this.detailStore.exportBlankList();
        if (!blob) {
          if (this.detailStore.errorMessageSignal()) {
            this.notificationService.error(this.detailStore.errorMessageSignal()!);
          }
          return;
        }

        if (globalThis.window === undefined) return;

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = this.buildPdfFileName();
        anchor.click();
        URL.revokeObjectURL(url);
        this.notificationService.success('Lista exportada com sucesso');
      },
    });
  }

  formatPercent(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  notePreview(note: string | null | undefined): string {
    if (!note) return 'Sem justificativa';
    const trimmed = note.trim();
    return trimmed.length <= 80 ? trimmed : `${trimmed.slice(0, 80)}…`;
  }

  private async autoSave(): Promise<void> {
    this.isAutoSavingSignal.set(true);
    try {
      await this.detailStore.savePendingChanges();
    } finally {
      this.isAutoSavingSignal.set(false);
    }
  }

  private buildPdfFileName(): string {
    const event = this.detailStore.eventSignal();
    const date = event?.eventDate ?? 'lista';
    const congregation =
      this.detailStore.congregationNameSignal() ??
      this.detailStore.congregationLabelSignal();

    return `santa-ceia-${this.toFileSafeName(congregation)}-${date}.pdf`;
  }

  private toFileSafeName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }
}

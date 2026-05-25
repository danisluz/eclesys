import {
  ChangeDetectionStrategy,
  Component,
  inject,
  DestroyRef,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { CommunionEventDetailStore } from '../../stores/communion-event-detail.store';
import {
  AttendanceStatus,
  CommunionMemberAttendance,
} from '../../models/communion.models';
import { CommunionStatusChipComponent } from '../../components/communion-status-chip/communion-status-chip.component';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { AttendanceNoteDialogComponent } from '../../dialogs/attendance-note-dialog/attendance-note-dialog.component';

@Component({
  selector: 'app-communion-event-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    TableModule,
    ButtonModule,
    ToggleSwitchModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ProgressSpinnerModule,
    TooltipModule,
    CommunionStatusChipComponent,
    AttendanceNoteDialogComponent,
  ],
  templateUrl: './communion-event-detail-page.component.html',
  styleUrl: './communion-event-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunionEventDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly detailStore = inject(CommunionEventDetailStore);

  noteDialogVisible = signal(false);
  noteDialogMember = signal<CommunionMemberAttendance | null>(null);

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => this.detailStore.setMemberSearchTerm(term));

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const eventId = params.get('eventId');
        if (!eventId) {
          this.router.navigate(['/app/santa-ceia']);
          return;
        }
        this.detailStore.loadEvent(eventId);
      });
  }

  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  goBack(): void {
    this.router.navigate(['/app/santa-ceia']);
  }

  updateAttendanceStatus(
    member: CommunionMemberAttendance,
    status: AttendanceStatus,
  ): void {
    if (!this.isAttendanceStatus(status)) return;
    this.detailStore.updateAttendanceStatus(member.memberId, status);
  }

  getAttendanceStatus(member: CommunionMemberAttendance): AttendanceStatus {
    return member.status ?? (member.present ? 'PRESENT' : 'ABSENT');
  }

  trackMember(_index: number, member: CommunionMemberAttendance): string {
    return member.memberId;
  }

  onSortChange(event: { field: string; order: number }): void {
    const active = event.field as 'registrationNumber' | 'fullName' | 'status';
    if (!active) return;
    this.detailStore.setSort(active, event.order === 1 ? 'asc' : 'desc');
  }

  openNoteDialog(member: CommunionMemberAttendance): void {
    if (!this.detailStore.notesEnabledSignal()) return;
    if (this.getAttendanceStatus(member) !== 'JUSTIFIED') return;
    this.noteDialogMember.set(member);
    this.noteDialogVisible.set(true);
  }

  onNoteSaved(note: string | null): void {
    const member = this.noteDialogMember();
    if (!member) return;
    this.detailStore.updateNote(member.memberId, note);
    this.noteDialogMember.set(null);
  }

  getNotePreview(note: string | null | undefined): string {
    if (!note) return 'Sem anotação';
    const trimmed = note.trim();
    return trimmed.length <= 120 ? trimmed : `${trimmed.slice(0, 120)}…`;
  }

  async saveChanges(): Promise<void> {
    const updatedCount = await this.detailStore.savePendingChanges();
    if (updatedCount > 0) {
      this.notificationService.success('Presenças salvas com sucesso');
    } else if (this.detailStore.errorMessageSignal()) {
      this.notificationService.error(this.detailStore.errorMessageSignal()!);
    }
  }

  async openEvent(): Promise<void> {
    const confirmed = await this.openConfirmDialog(
      'Abrir evento',
      'Deseja abrir este evento de Santa Ceia?',
    );
    if (!confirmed) return;
    const updated = await this.detailStore.openEvent();
    if (updated) {
      this.notificationService.success('Evento aberto');
    } else if (this.detailStore.errorMessageSignal()) {
      this.notificationService.error(this.detailStore.errorMessageSignal()!);
    }
  }

  async closeEvent(): Promise<void> {
    const confirmed = await this.openConfirmDialog(
      'Fechar evento',
      'Deseja fechar este evento? Após fechado, não será possível editar presenças.',
    );
    if (!confirmed) return;
    const updated = await this.detailStore.closeEvent();
    if (updated) {
      this.notificationService.success('Evento fechado');
    } else if (this.detailStore.errorMessageSignal()) {
      this.notificationService.error(this.detailStore.errorMessageSignal()!);
    }
  }

  async exportBlankList(): Promise<void> {
    const confirmed = await this.openConfirmDialog(
      'Exportar lista',
      'Deseja gerar o PDF para uso no modo manual?',
    );
    if (!confirmed) return;

    const blob = await this.detailStore.exportBlankList();
    if (!blob) {
      if (this.detailStore.errorMessageSignal()) {
        this.notificationService.error(this.detailStore.errorMessageSignal()!);
      }
      return;
    }

    if (globalThis.window === undefined) return;

    const fileName = this.buildPdfFileName();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    this.notificationService.success('Lista exportada com sucesso');
  }

  onMemberSearch(term: string): void {
    this.searchSubject.next(term);
  }

  private isAttendanceStatus(value: string): value is AttendanceStatus {
    return value === 'PRESENT' || value === 'ABSENT' || value === 'JUSTIFIED';
  }

  private openConfirmDialog(header: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        header,
        message,
        acceptLabel: 'Confirmar',
        rejectLabel: 'Cancelar',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
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

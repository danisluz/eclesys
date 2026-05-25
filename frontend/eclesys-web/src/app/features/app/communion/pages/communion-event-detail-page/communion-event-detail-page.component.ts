import { Component, inject, afterNextRender } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
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
import { ConfirmDialogComponent } from '../../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';
import {
  AttendanceNoteDialogComponent,
  AttendanceNoteDialogData,
} from '../../dialogs/attendance-note-dialog/attendance-note-dialog.component';

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
  ],
  templateUrl: './communion-event-detail-page.component.html',
  styleUrl: './communion-event-detail-page.component.scss',
})
export class CommunionEventDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly notificationService = inject(NotificationService);

  readonly detailStore = inject(CommunionEventDetailStore);

  constructor() {
    afterNextRender(() => {
      const eventId = this.route.snapshot.paramMap.get('eventId');
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

  onSortChange(event: { field: string; order: number }): void {
    const active = event.field as 'registrationNumber' | 'fullName' | 'status';
    if (!active) return;
    this.detailStore.setSort(active, event.order === 1 ? 'asc' : 'desc');
  }

  openNoteDialog(member: CommunionMemberAttendance): void {
    if (!this.detailStore.notesEnabledSignal()) return;
    if (this.getAttendanceStatus(member) !== 'JUSTIFIED') return;

    const canEdit = !this.detailStore.isEditingLockedSignal();
    const data: AttendanceNoteDialogData = {
      memberName: member.fullName,
      note: member.note ?? null,
      canEdit,
    };

    this.dialogService
      ?.open(AttendanceNoteDialogComponent, {
        header: 'Anotação de Presença',
        width: '520px',
        data,
      })
      ?.onClose.subscribe((note: string | null | undefined) => {
        if (note === undefined) return;
        this.detailStore.updateNote(member.memberId, note);
      });
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
    this.detailStore.setMemberSearchTerm(term);
  }

  private isAttendanceStatus(value: string): value is AttendanceStatus {
    return value === 'PRESENT' || value === 'ABSENT' || value === 'JUSTIFIED';
  }

  private openConfirmDialog(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogService
        ?.open(ConfirmDialogComponent, {
          data: {
            title,
            message,
            confirmLabel: 'Confirmar',
            cancelLabel: 'Cancelar',
          },
        })
        ?.onClose.subscribe((confirmed) => resolve(Boolean(confirmed)));
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

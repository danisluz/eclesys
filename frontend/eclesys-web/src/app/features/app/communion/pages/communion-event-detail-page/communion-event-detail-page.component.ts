import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { afterNextRender } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    CommunionStatusChipComponent,
  ],
  templateUrl: './communion-event-detail-page.component.html',
  styleUrl: './communion-event-detail-page.component.scss',
})
export class CommunionEventDetailPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  detailStore = inject(CommunionEventDetailStore);

  displayedColumnsSignal = computed(() => {
    const base = ['registrationNumber', 'fullName', 'status'];
    return this.detailStore.notesEnabledSignal() ? [...base, 'note'] : base;
  });

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
    const parsed = new Date(date + 'T00:00:00');
    return parsed.toLocaleDateString('pt-BR');
  }

  goBack(): void {
    this.router.navigate(['/app/santa-ceia']);
  }

  updateAttendanceStatus(
    member: CommunionMemberAttendance,
    status: AttendanceStatus | null,
  ): void {
    if (!status) return;
    if (!this.isAttendanceStatus(status)) return;
    this.detailStore.updateAttendanceStatus(member.memberId, status);
  }

  getAttendanceStatus(member: CommunionMemberAttendance): AttendanceStatus {
    return member.status ?? (member.present ? 'PRESENT' : 'ABSENT');
  }

  onSortChange(sort: Sort): void {
    const active = sort.active as 'registrationNumber' | 'fullName' | 'status';
    if (!active) return;
    this.detailStore.setSort(active, sort.direction);
  }

  private isAttendanceStatus(value: string): value is AttendanceStatus {
    return value === 'PRESENT' || value === 'ABSENT' || value === 'JUSTIFIED';
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

    const dialogRef = this.dialog.open(AttendanceNoteDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      data,
    });

    dialogRef.afterClosed().subscribe((note: string | null | undefined) => {
      if (note === undefined) return;
      this.detailStore.updateNote(member.memberId, note);
    });
  }

  getNotePreview(note: string | null | undefined): string {
    if (!note) return 'Sem anotação';
    const trimmed = note.trim();
    if (trimmed.length <= 120) return trimmed;
    return `${trimmed.slice(0, 120)}…`;
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
      'primary',
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
      'warn',
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
    const payload = await this.detailStore.exportBlankList();
    if (!payload) {
      if (this.detailStore.errorMessageSignal()) {
        this.notificationService.error(this.detailStore.errorMessageSignal()!);
      }
      return;
    }

    const fileName = `santa-ceia-${payload.event.eventDate}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
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

  private openConfirmDialog(
    title: string,
    message: string,
    confirmColor: 'primary' | 'accent' | 'warn',
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title,
            message,
            confirmColor,
            confirmLabel: 'Confirmar',
            cancelLabel: 'Cancelar',
          },
        })
        .afterClosed()
        .subscribe((confirmed) => resolve(Boolean(confirmed)));
    });
  }
}

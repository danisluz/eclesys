import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { afterNextRender } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommunionEventsStore } from '../../stores/communion-events.store';
import { CommunionEventListItem, CommunionEventStatus } from '../../models/communion.models';
import { CreateCommunionEventDialogComponent } from '../../dialogs/create-communion-event-dialog/create-communion-event-dialog.component';
import { ConfirmDialogComponent } from '../../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';

@Component({
  selector: 'app-communion-events-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './communion-events-page.component.html',
  styleUrl: './communion-events-page.component.scss',
})
export class CommunionEventsPageComponent {
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  eventsStore = inject(CommunionEventsStore);

  congregationSearchControl = new FormControl<string | OrganizationUnit | null>(
    '',
  );

  pageIndexSignal = signal(0);
  pageSizeSignal = signal(25);
  pageSizeOptions = [25, 50, 100, 200];

  eventsTotalSignal = computed(() => this.eventsStore.eventsViewSignal().length);
  eventsOpenSignal = computed(
    () =>
      this.eventsStore
        .eventsViewSignal()
        .filter((event) => event.status === 'OPEN').length,
  );
  averageAttendancePercentSignal = computed(() => {
    const events = this.eventsStore.eventsViewSignal();
    const percentages = events
      .map((event) => this.getAttendancePercent(event))
      .filter((value): value is number => typeof value === 'number');
    if (percentages.length === 0) return null;
    const total = percentages.reduce((sum, value) => sum + value, 0);
    return Math.round(total / percentages.length);
  });

  pagedEventsSignal = computed(() => {
    const events = this.eventsStore.eventsViewSignal();
    const pageIndex = this.pageIndexSignal();
    const pageSize = this.pageSizeSignal();
    const start = pageIndex * pageSize;
    return events.slice(start, start + pageSize);
  });

  displayedColumns = [
    'eventDate',
    'congregation',
    'situation',
    'attendance',
    'actions',
  ];

  constructor() {
    afterNextRender(() => {
      this.eventsStore.loadCongregations();
      this.eventsStore.loadEvents();
    });

    effect(() => {
      const total = this.eventsTotalSignal();
      const pageSize = this.pageSizeSignal();
      const maxPage = total === 0 ? 0 : Math.floor((total - 1) / pageSize);
      if (this.pageIndexSignal() > maxPage) {
        this.pageIndexSignal.set(maxPage);
      }
    });
  }

  async openCreateDialog(): Promise<void> {
    this.eventsStore.clearCreateError();
    const dialogRef = this.dialog.open(CreateCommunionEventDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      autoFocus: false,
      data: {
        congregations: this.eventsStore.congregationsSignal(),
        defaultCongregationId: this.eventsStore.selectedCongregationIdSignal(),
        congregationLabel: this.eventsStore.congregationLabelSignal(),
      },
    });

    dialogRef.afterClosed().subscribe((createdEvent) => {
      if (createdEvent?.id) {
        this.notificationService.success('Evento criado com sucesso');
        this.router.navigate(['/app/santa-ceia', createdEvent.id]);
      }
    });
  }

  onCongregationChange(value: string | null): void {
    this.eventsStore.setSelectedCongregation(value);
    this.pageIndexSignal.set(0);
    this.eventsStore.loadEvents();
  }

  onCongregationSelected(event: MatAutocompleteSelectedEvent): void {
    const congregation = event.option.value as OrganizationUnit;
    this.onCongregationChange(congregation.id);
  }

  onCongregationInput(value: string): void {
    if (value !== '') return;
    if (!this.eventsStore.selectedCongregationIdSignal()) return;
    this.congregationSearchControl.setValue('', { emitEvent: false });
    this.onCongregationChange(null);
  }

  clearCongregationFilter(): void {
    this.congregationSearchControl.setValue('', { emitEvent: false });
    this.onCongregationChange(null);
  }

  onStatusChange(value: CommunionEventStatus | null): void {
    this.eventsStore.setSelectedStatus(value);
    this.pageIndexSignal.set(0);
    this.eventsStore.loadEvents();
  }

  onStartDateChange(date: Date | null): void {
    const current = this.eventsStore.dateRangeSignal();
    this.eventsStore.setDateRange(date, current.end);
    this.pageIndexSignal.set(0);
    this.eventsStore.loadEvents();
  }

  onEndDateChange(date: Date | null): void {
    const current = this.eventsStore.dateRangeSignal();
    this.eventsStore.setDateRange(current.start, date);
    this.pageIndexSignal.set(0);
    this.eventsStore.loadEvents();
  }

  clearFilters(): void {
    this.congregationSearchControl.setValue('', { emitEvent: false });
    this.eventsStore.clearFilters();
    this.pageIndexSignal.set(0);
    this.eventsStore.loadEvents();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndexSignal.set(event.pageIndex);
    this.pageSizeSignal.set(event.pageSize);
  }

  viewEvent(event: CommunionEventListItem): void {
    this.router.navigate(['/app/santa-ceia', event.id]);
  }

  async openEvent(event: CommunionEventListItem): Promise<void> {
    const confirmed = await this.openConfirmDialog(
      'Abrir evento',
      'Deseja abrir este evento de Santa Ceia? Após aberto, será possível lançar presenças.',
      'primary',
    );

    if (!confirmed) return;

    const updated = await this.eventsStore.openEvent(event.id);
    if (updated) {
      this.notificationService.success('Evento aberto com sucesso');
    } else {
      this.notificationService.error('Não foi possível abrir o evento');
    }
  }

  async closeEvent(event: CommunionEventListItem): Promise<void> {
    const confirmed = await this.openConfirmDialog(
      'Fechar evento',
      'Deseja fechar este evento? Após fechado não será possível editar presenças.',
      'warn',
    );

    if (!confirmed) return;

    const updated = await this.eventsStore.closeEvent(event.id);
    if (updated) {
      this.notificationService.success('Evento fechado com sucesso');
    } else {
      this.notificationService.error('Não foi possível fechar o evento');
    }
  }

  canOpen(event: CommunionEventListItem): boolean {
    return event.status === 'DRAFT';
  }

  canClose(event: CommunionEventListItem): boolean {
    return event.status === 'OPEN';
  }

  formatDate(date: string): string {
    const parsed = new Date(date + 'T00:00:00');
    return parsed.toLocaleDateString('pt-BR');
  }

  displayCongregation(
    congregation: OrganizationUnit | string | null,
  ): string {
    if (!congregation || typeof congregation === 'string') return '';
    return congregation.name;
  }

  filterCongregations(
    value: string | OrganizationUnit | null,
  ): OrganizationUnit[] {
    const congregations = this.eventsStore.congregationsSignal();
    if (!congregations.length) return [];

    const term =
      typeof value === 'string' ? value : value?.name ?? '';
    const normalized = term.toLowerCase().trim();

    if (!normalized) return congregations;

    return congregations.filter((congregation) =>
      congregation.name.toLowerCase().includes(normalized),
    );
  }

  getSituationLabel(status: CommunionEventListItem['status']): string {
    switch (status) {
      case 'OPEN':
        return 'Em andamento';
      case 'CLOSED':
        return 'Encerrada';
      default:
        return 'Rascunho';
    }
  }

  getSituationHint(status: CommunionEventListItem['status']): string | null {
    switch (status) {
      case 'OPEN':
        return 'marcação liberada';
      case 'CLOSED':
        return 'somente leitura';
      default:
        return null;
    }
  }

  getAttendancePercent(event: CommunionEventListItem): number | null {
    if (typeof event.presentCount !== 'number') return null;
    if (typeof event.totalMembers !== 'number') return null;
    if (event.totalMembers <= 0) return null;

    if (typeof event.attendancePercent === 'number') {
      return Math.round(event.attendancePercent);
    }

    const computed = (event.presentCount / event.totalMembers) * 100;
    return Math.round(computed);
  }

  getAttendanceText(event: CommunionEventListItem): string {
    const percent = this.getAttendancePercent(event);
    if (percent === null) return '-';
    return `${event.presentCount}/${event.totalMembers} (${percent}%)`;
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

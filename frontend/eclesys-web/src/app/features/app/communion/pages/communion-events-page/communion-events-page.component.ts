import {
  Component,
  inject,
  computed,
  effect,
  signal,
  afterNextRender,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DrawerModule } from 'primeng/drawer';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { CommunionEventsStore } from '../../stores/communion-events.store';
import {
  CommunionEvent,
  CommunionEventListItem,
} from '../../models/communion.models';
import { CreateCommunionEventDialogComponent } from '../../dialogs/create-communion-event-dialog/create-communion-event-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-communion-events-page',
  standalone: true,
  imports: [
    FormsModule,
    DrawerModule,
    DatePickerModule,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    ProgressSpinnerModule,
    TooltipModule,
    CreateCommunionEventDialogComponent,
  ],
  templateUrl: './communion-events-page.component.html',
  styleUrl: './communion-events-page.component.scss',
})
export class CommunionEventsPageComponent {
  private readonly dialogService = inject(DialogService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  readonly eventsStore = inject(CommunionEventsStore);

  pageIndexSignal = signal(0);
  pageSizeSignal = signal(25);
  pageSizeOptions = [25, 50, 100, 200];
  createDrawerVisible = signal(false);

  eventsTotalSignal = computed(
    () => this.eventsStore.eventsViewSignal().length,
  );
  eventsOpenSignal = computed(
    () =>
      this.eventsStore.eventsViewSignal().filter((e) => e.status === 'OPEN')
        .length,
  );
  averageAttendancePercentSignal = computed(() => {
    const events = this.eventsStore.eventsViewSignal();
    const percentages = events
      .map((e) => this.getAttendancePercent(e))
      .filter((v): v is number => typeof v === 'number');
    if (percentages.length === 0) return null;
    return Math.round(
      percentages.reduce((sum, v) => sum + v, 0) / percentages.length,
    );
  });

  statusOptions = [
    { label: 'Rascunho', value: 'DRAFT' },
    { label: 'Aberto', value: 'OPEN' },
    { label: 'Fechado', value: 'CLOSED' },
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

  openCreateDrawer(): void {
    this.eventsStore.clearCreateError();
    this.createDrawerVisible.set(true);
  }

  onEventCreated(createdEvent: CommunionEvent): void {
    this.createDrawerVisible.set(false);
    if (createdEvent?.id) {
      this.notificationService.success('Evento criado com sucesso');
      this.router.navigate(['/app/santa-ceia', createdEvent.id]);
    }
  }

  onCongregationChange(value: string | null): void {
    this.eventsStore.setSelectedCongregation(value);
    this.pageIndexSignal.set(0);
    this.eventsStore.loadEvents();
  }

  onStatusChange(value: string | null): void {
    this.eventsStore.setSelectedStatus(value as any);
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
    this.eventsStore.clearFilters();
    this.pageIndexSignal.set(0);
    this.eventsStore.loadEvents();
  }

  onPageChange(event: TablePageEvent): void {
    this.pageIndexSignal.set(Math.floor(event.first / event.rows));
    this.pageSizeSignal.set(event.rows);
  }

  viewEvent(event: CommunionEventListItem): void {
    this.router.navigate(['/app/santa-ceia', event.id]);
  }

  async openEvent(event: CommunionEventListItem): Promise<void> {
    const confirmed = await this.openConfirmDialog(
      'Abrir evento',
      'Deseja abrir este evento de Santa Ceia? Após aberto, será possível lançar presenças.',
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
    );
    if (!confirmed) return;
    const updated = await this.eventsStore.closeEvent(event.id);
    if (updated) {
      this.notificationService.success('Evento fechado com sucesso');
    } else {
      this.notificationService.error('Não foi possível fechar o evento');
    }
  }

  async exportEventPdf(event: CommunionEventListItem): Promise<void> {
    const confirmed = await this.openConfirmDialog(
      'Exportar lista',
      'Deseja gerar o PDF para uso no modo manual?',
    );
    if (!confirmed) return;

    const result = await this.eventsStore.exportBlankListPdf(event.id);
    if (!result.blob) {
      this.notificationService.error(
        result.errorMessage ?? 'Não foi possível exportar a lista em branco.',
      );
      return;
    }

    if (globalThis.window === undefined) return;

    const fileName = this.buildPdfFileName(event);
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    this.notificationService.success('Lista exportada com sucesso');
  }

  canOpen(event: CommunionEventListItem): boolean {
    return event.status === 'DRAFT';
  }

  canClose(event: CommunionEventListItem): boolean {
    return event.status === 'OPEN';
  }

  getStatusSeverity(
    status: CommunionEventListItem['status'],
  ): 'success' | 'info' | 'secondary' {
    if (status === 'OPEN') return 'success';
    if (status === 'DRAFT') return 'info';
    return 'secondary';
  }

  getSituationLabel(status: CommunionEventListItem['status']): string {
    if (status === 'OPEN') return 'Em andamento';
    if (status === 'CLOSED') return 'Encerrada';
    return 'Rascunho';
  }

  getSituationHint(status: CommunionEventListItem['status']): string | null {
    if (status === 'OPEN') return 'marcação liberada';
    if (status === 'CLOSED') return 'somente leitura';
    return null;
  }

  getAttendancePercent(event: CommunionEventListItem): number | null {
    if (typeof event.presentCount !== 'number') return null;
    if (typeof event.totalMembers !== 'number') return null;
    if (event.totalMembers <= 0) return null;
    if (typeof event.attendancePercent === 'number')
      return Math.round(event.attendancePercent);
    return Math.round((event.presentCount / event.totalMembers) * 100);
  }

  getAttendanceText(event: CommunionEventListItem): string {
    const percent = this.getAttendancePercent(event);
    if (percent === null) return '-';
    return `${event.presentCount}/${event.totalMembers} (${percent}%)`;
  }

  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
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

  private buildPdfFileName(event: CommunionEventListItem): string {
    const safe = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    return `santa-ceia-${safe(event.congregationName ?? '')}-${event.eventDate}.pdf`;
  }
}

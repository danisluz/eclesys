import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  afterNextRender,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { AppConfirmService } from '../../../../../core/services/app-confirm.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { CommunionEventsStore } from '../../stores/communion-events.store';
import {
  CommunionEvent,
  CommunionEventListItem,
  CommunionEventStatus,
} from '../../models/communion.models';

@Component({
  selector: 'app-communion-events-v2-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
  ],
  templateUrl: './communion-events-v2-page.component.html',
  styleUrl: './communion-events-v2-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunionEventsV2PageComponent {
  private readonly confirmService = inject(AppConfirmService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  readonly eventsStore = inject(CommunionEventsStore);

  readonly pageSize = 25;
  readonly showCreateFormSignal = signal(false);
  readonly createCongregationIdSignal = signal('');
  readonly createEventDateSignal = signal<Date | null>(null);

  readonly statusOptions: { label: string; value: CommunionEventStatus }[] = [
    { label: 'Rascunho', value: 'DRAFT' },
    { label: 'Em andamento', value: 'OPEN' },
    { label: 'Encerrado', value: 'CLOSED' },
  ];

  readonly eventsTotalSignal = computed(
    () => this.eventsStore.eventsViewSignal().length,
  );
  readonly eventsOpenSignal = computed(
    () =>
      this.eventsStore
        .eventsViewSignal()
        .filter((event) => event.status === 'OPEN').length,
  );
  readonly averageAttendancePercentSignal = computed(() => {
    const percentages = this.eventsStore
      .eventsViewSignal()
      .map((event) => this.getAttendancePercent(event))
      .filter((value): value is number => typeof value === 'number');

    if (percentages.length === 0) return null;

    return Math.round(
      percentages.reduce((sum, value) => sum + value, 0) / percentages.length,
    );
  });

  readonly visibleEventsSignal = computed(() =>
    this.eventsStore.eventsViewSignal().slice(0, this.pageSize),
  );

  constructor() {
    afterNextRender(() => {
      void this.eventsStore.loadCongregations();
      void this.eventsStore.loadEvents();
    });
  }

  openCreateForm(): void {
    this.eventsStore.clearCreateError();
    this.createCongregationIdSignal.set(
      this.eventsStore.selectedCongregationIdSignal() ?? '',
    );
    this.createEventDateSignal.set(new Date());
    this.showCreateFormSignal.set(true);
  }

  closeCreateForm(): void {
    this.showCreateFormSignal.set(false);
  }

  async createEvent(): Promise<void> {
    const congregationId = this.createCongregationIdSignal().trim();
    const date = this.createEventDateSignal();

    if (!congregationId || !date) {
      this.notificationService.warn(
        'Selecione a congregação e informe a data do evento.',
      );
      return;
    }

    const created = await this.eventsStore.createEvent({
      congregationId,
      eventDate: this.formatDateOnly(date),
    });

    if (!created?.id) {
      if (this.eventsStore.createErrorMessageSignal()) {
        this.notificationService.error(
          this.eventsStore.createErrorMessageSignal()!,
        );
      }
      return;
    }

    this.closeCreateForm();
    this.notificationService.success('Evento criado com sucesso');
    void this.router.navigate(['/app/santa-ceia/v2', created.id]);
  }

  async refresh(): Promise<void> {
    await this.eventsStore.loadEvents();
  }

  async onCongregationChange(value: string | null): Promise<void> {
    this.eventsStore.setSelectedCongregation(value || null);
    await this.eventsStore.loadEvents();
  }

  async onStatusChange(value: CommunionEventStatus | null): Promise<void> {
    this.eventsStore.setSelectedStatus(value);
    await this.eventsStore.loadEvents();
  }

  async onStartDateChange(value: Date | null): Promise<void> {
    const current = this.eventsStore.dateRangeSignal();
    this.eventsStore.setDateRange(value, current.end);
    await this.eventsStore.loadEvents();
  }

  async onEndDateChange(value: Date | null): Promise<void> {
    const current = this.eventsStore.dateRangeSignal();
    this.eventsStore.setDateRange(current.start, value);
    await this.eventsStore.loadEvents();
  }

  async clearFilters(): Promise<void> {
    this.eventsStore.clearFilters();
    await this.eventsStore.loadEvents();
  }

  viewEvent(event: CommunionEventListItem): void {
    void this.router.navigate(['/app/santa-ceia/v2', event.id]);
  }

  openEvent(event: CommunionEventListItem): void {
    this.confirmService.confirm({
      header: 'Abrir evento',
      message:
        'Deseja abrir este evento de Santa Ceia? Após aberto, será possível lançar presenças.',
      accept: async () => {
        const updated = await this.eventsStore.openEvent(event.id);
        if (updated) {
          this.notificationService.success('Evento aberto com sucesso');
        } else {
          this.notificationService.error('Não foi possível abrir o evento');
        }
      },
    });
  }

  closeEvent(event: CommunionEventListItem): void {
    this.confirmService.confirm({
      header: 'Fechar evento',
      message:
        'Deseja fechar este evento? Após fechado não será possível editar presenças.',
      accept: async () => {
        const updated = await this.eventsStore.closeEvent(event.id);
        if (updated) {
          this.notificationService.success('Evento fechado com sucesso');
        } else {
          this.notificationService.error('Não foi possível fechar o evento');
        }
      },
    });
  }

  exportEventPdf(event: CommunionEventListItem): void {
    this.confirmService.confirm({
      header: 'Exportar lista',
      message: 'Deseja gerar o PDF para uso no modo manual?',
      accept: async () => {
        const result = await this.eventsStore.exportBlankListPdf(event.id);
        if (!result.blob) {
          this.notificationService.error(
            result.errorMessage ??
              'Não foi possível exportar a lista em branco.',
          );
          return;
        }

        if (globalThis.window === undefined) return;

        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = this.buildPdfFileName(event);
        anchor.click();
        URL.revokeObjectURL(url);
        this.notificationService.success('Lista exportada com sucesso');
      },
    });
  }

  canOpen(event: CommunionEventListItem): boolean {
    return event.status === 'DRAFT';
  }

  canClose(event: CommunionEventListItem): boolean {
    return event.status === 'OPEN';
  }

  getSituationLabel(status: CommunionEventListItem['status']): string {
    if (status === 'OPEN') return 'Em andamento';
    if (status === 'CLOSED') return 'Encerrado';
    return 'Rascunho';
  }

  getSituationSeverity(
    status: CommunionEventListItem['status'],
  ): 'success' | 'secondary' | 'info' {
    if (status === 'OPEN') return 'success';
    if (status === 'CLOSED') return 'secondary';
    return 'info';
  }

  getAttendancePercent(event: CommunionEventListItem): number | null {
    if (typeof event.presentCount !== 'number') return null;
    if (typeof event.totalMembers !== 'number') return null;
    if (event.totalMembers <= 0) return null;
    if (typeof event.attendancePercent === 'number') {
      return Math.round(event.attendancePercent);
    }
    return Math.round((event.presentCount / event.totalMembers) * 100);
  }

  formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
  }

  congregationName(event: CommunionEvent): string {
    return (
      this.eventsStore.congregationMapSignal().get(event.congregationId) ?? '—'
    );
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildPdfFileName(event: CommunionEventListItem): string {
    const safe = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

    return `santa-ceia-${safe(event.congregationName ?? '')}-${event.eventDate}.pdf`;
  }
}

import {
  Component,
  signal,
  inject,
  afterNextRender,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  DashboardService,
  DashboardStats,
} from '../../../../../shared/api/dashboard.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  standalone: true,
  imports: [ButtonModule, ProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private resizeObserver?: ResizeObserver;

  @ViewChild('transfersChart') transfersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('genderChart') genderChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('organizationsChart') organizationsChartRef!: ElementRef<HTMLCanvasElement>;

  private transfersChart?: Chart;
  private statusChart?: Chart;
  private genderChart?: Chart;
  private organizationsChart?: Chart;

  stats = signal<DashboardStats | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor() {
    afterNextRender(() => this.loadStats());
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const checkStats = setInterval(() => {
        if (this.stats()) {
          clearInterval(checkStats);
          this.createTransfersChart();
          this.createStatusChart();
          this.createGenderChart();
          this.createOrganizationsChart();
          this.setupResizeObserver();
        }
      }, 100);
    }
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.stats.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar dados');
        this.isLoading.set(false);
      },
    });
  }

  private createTransfersChart(): void {
    if (!this.transfersChartRef || this.transfersChart) return;
    const stats = this.stats();
    if (!stats) return;
    const ctx = this.transfersChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Pendentes', 'Aprovadas', 'Rejeitadas', 'Canceladas'],
        datasets: [{
          data: [stats.transfersPending, stats.transfersApproved, stats.transfersRejected, stats.transfersCancelled],
          backgroundColor: ['#fbbf24', '#10b981', '#ef4444', '#9ca3af'],
          borderWidth: 0,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { family: 'Inter, sans-serif', size: 13 } } } } },
    };
    this.transfersChart = new Chart(ctx, config);
  }

  private createStatusChart(): void {
    if (!this.statusChartRef || this.statusChart) return;
    const stats = this.stats();
    if (!stats) return;
    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['Ativos', 'Inativos', 'Transferidos', 'Falecidos'],
        datasets: [{
          data: [stats.membersActive, stats.membersInactive, stats.membersTransferred, stats.membersDeceased],
          backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#6b7280'],
          borderWidth: 0,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { family: 'Inter, sans-serif', size: 13 } } } } },
    };
    this.statusChart = new Chart(ctx, config);
  }

  private createGenderChart(): void {
    if (!this.genderChartRef || this.genderChart) return;
    const stats = this.stats();
    if (!stats) return;
    const ctx = this.genderChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Masculino', 'Feminino'],
        datasets: [{
          data: [stats.membersMale, stats.membersFemale],
          backgroundColor: ['#3b82f6', '#ec4899'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { family: 'Inter, sans-serif', size: 13 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed || 0;
                const total = stats.membersMale + stats.membersFemale;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${value} (${pct}%)`;
              },
            },
          },
        },
      },
    };
    this.genderChart = new Chart(ctx, config);
  }

  private createOrganizationsChart(): void {
    if (!this.organizationsChartRef || this.organizationsChart) return;
    const stats = this.stats();
    if (!stats?.membersByOrganization) return;
    const ctx = this.organizationsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: stats.membersByOrganization.map((o) => o.organizationName),
        datasets: [{ label: 'Membros', data: stats.membersByOrganization.map((o) => o.memberCount), backgroundColor: '#6366f1', borderRadius: 8 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { maxRotation: 45, minRotation: 45 } } },
      },
    };
    this.organizationsChart = new Chart(ctx, config);
  }

  private setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this.transfersChart?.resize();
        this.statusChart?.resize();
        this.genderChart?.resize();
        this.organizationsChart?.resize();
      });
    });
    const grid = document.querySelector('.charts-grid');
    if (grid) this.resizeObserver.observe(grid);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.transfersChart?.destroy();
    this.statusChart?.destroy();
    this.genderChart?.destroy();
    this.organizationsChart?.destroy();
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }
}

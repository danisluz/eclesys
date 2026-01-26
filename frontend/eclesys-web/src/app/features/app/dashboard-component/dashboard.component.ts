import {
  Component,
  signal,
  inject,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  DashboardService,
  DashboardStats,
} from '../../../shared/api/dashboard.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDivider,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private resizeObserver?: ResizeObserver;

  @ViewChild('transfersChart')
  transfersChartRef!: ElementRef<HTMLCanvasElement>;
  private transfersChart?: Chart;

  @ViewChild('statusChart')
  statusChartRef!: ElementRef<HTMLCanvasElement>;
  private statusChart?: Chart;

  @ViewChild('genderChart')
  genderChartRef!: ElementRef<HTMLCanvasElement>;
  private genderChart?: Chart;

  @ViewChild('organizationsChart')
  organizationsChartRef!: ElementRef<HTMLCanvasElement>;
  private organizationsChart?: Chart;

  stats = signal<DashboardStats | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Aguarda os dados serem carregados antes de criar os gráficos
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
      error: (err) => {
        console.error('Erro ao carregar estatísticas:', err);
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
        datasets: [
          {
            data: [
              stats.transfersPending,
              stats.transfersApproved,
              stats.transfersRejected,
              stats.transfersCancelled,
            ],
            backgroundColor: [
              '#fbbf24', // Amarelo (pending)
              '#10b981', // Verde (approved)
              '#ef4444', // Vermelho (rejected)
              '#9ca3af', // Cinza (cancelled)
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: {
                family: 'Inter, sans-serif',
                size: 13,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return ` ${label}: ${value}`;
              },
            },
          },
        },
      },
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
        datasets: [
          {
            data: [
              stats.membersActive,
              stats.membersInactive,
              stats.membersTransferred,
              stats.membersDeceased,
            ],
            backgroundColor: [
              '#10b981', // Verde (active)
              '#f59e0b', // Laranja (inactive)
              '#3b82f6', // Azul (transferred)
              '#6b7280', // Cinza (deceased)
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: {
                family: 'Inter, sans-serif',
                size: 13,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return ` ${label}: ${value}`;
              },
            },
          },
        },
      },
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
        datasets: [
          {
            data: [stats.membersMale, stats.membersFemale],
            backgroundColor: [
              '#3b82f6', // Azul (male)
              '#ec4899', // Rosa (female)
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: {
                family: 'Inter, sans-serif',
                size: 13,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = stats.membersMale + stats.membersFemale;
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return ` ${label}: ${value} (${percentage}%)`;
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
    if (!stats || !stats.membersByOrganization) return;

    const ctx = this.organizationsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: stats.membersByOrganization.map((org) => org.organizationName),
        datasets: [
          {
            label: 'Membros',
            data: stats.membersByOrganization.map((org) => org.memberCount),
            backgroundColor: '#3b82f6',
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y || 0;
                return ` ${value} membros`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
        },
      },
    };

    this.organizationsChart = new Chart(ctx, config);
  }

  private setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Observa mudanças de tamanho nos containers dos gráficos
    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this.transfersChart?.resize();
        this.statusChart?.resize();
        this.genderChart?.resize();
        this.organizationsChart?.resize();
      });
    });

    // Observa o container principal
    const chartsGrid = document.querySelector('.charts-grid');
    if (chartsGrid) {
      this.resizeObserver.observe(chartsGrid);
    }
  }

  ngOnDestroy(): void {
    // Desconecta o observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Destroi os gráficos para liberar memória
    this.transfersChart?.destroy();
    this.statusChart?.destroy();
    this.genderChart?.destroy();
    this.organizationsChart?.destroy();
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }
}

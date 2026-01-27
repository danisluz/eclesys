import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemApiService } from './system-api.service';

type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

@Component({
  standalone: true,
  selector: 'app-system-status',
  imports: [CommonModule],
  templateUrl: './system-status.component.html',
  styleUrls: ['./system-status.component.scss'],
})
export class SystemStatusComponent {
  systemApiService = inject(SystemApiService);

  reloadTickSignal = signal(0);

  healthStateSignal = signal<LoadState<unknown>>({ status: 'idle' });
  pingStateSignal = signal<LoadState<unknown>>({ status: 'idle' });
  versionStateSignal = signal<LoadState<unknown>>({ status: 'idle' });

  constructor() {
    effect(() => {
      this.reloadTickSignal();
      this.loadAll();
    });
  }

  reload() {
    this.reloadTickSignal.update((value) => value + 1);
  }

  loadAll() {
    this.healthStateSignal.set({ status: 'loading' });
    this.systemApiService.getHealth().subscribe({
      next: (data) => this.healthStateSignal.set({ status: 'success', data }),
      error: (error) => this.healthStateSignal.set({ status: 'error', message: String(error?.message ?? error) })
    });

    this.pingStateSignal.set({ status: 'loading' });
    this.systemApiService.getPing().subscribe({
      next: (data) => this.pingStateSignal.set({ status: 'success', data }),
      error: (error) => this.pingStateSignal.set({ status: 'error', message: String(error?.message ?? error) })
    });

    this.versionStateSignal.set({ status: 'loading' });
    this.systemApiService.getVersion().subscribe({
      next: (data) => this.versionStateSignal.set({ status: 'success', data }),
      error: (error) => this.versionStateSignal.set({ status: 'error', message: String(error?.message ?? error) })
    });
  }

  healthText = computed(() => JSON.stringify(this.healthStateSignal(), null, 2));
  pingText = computed(() => JSON.stringify(this.pingStateSignal(), null, 2));
  versionText = computed(() => JSON.stringify(this.versionStateSignal(), null, 2));
}

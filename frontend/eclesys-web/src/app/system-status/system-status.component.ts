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
  template: `
    <section style="padding:16px; max-width: 900px">
      <h2>Status do Sistema</h2>

      <button (click)="reload()">Recarregar</button>

      <div style="display:grid; gap:12px; margin-top:12px">
        <div style="border:1px solid #ddd; padding:12px; border-radius:8px">
          <h3>Health</h3>
          <pre>{{ healthText() }}</pre>
        </div>

        <div style="border:1px solid #ddd; padding:12px; border-radius:8px">
          <h3>Ping</h3>
          <pre>{{ pingText() }}</pre>
        </div>

        <div style="border:1px solid #ddd; padding:12px; border-radius:8px">
          <h3>Version</h3>
          <pre>{{ versionText() }}</pre>
        </div>
      </div>
    </section>
  `
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

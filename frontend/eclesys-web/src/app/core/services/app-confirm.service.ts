import { Injectable, signal } from '@angular/core';

export interface AppConfirmOptions {
  header: string;
  message: string;
  acceptLabel?: string;
  rejectLabel?: string;
  accept: () => void;
  reject?: () => void;
}

export interface AppConfirmState {
  header: string;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  accept: () => void;
  reject?: () => void;
}

@Injectable({ providedIn: 'root' })
export class AppConfirmService {
  readonly state = signal<AppConfirmState | null>(null);

  confirm(options: AppConfirmOptions): void {
    this.state.set({
      header: options.header,
      message: options.message,
      acceptLabel: options.acceptLabel ?? 'Confirmar',
      rejectLabel: options.rejectLabel ?? 'Cancelar',
      accept: options.accept,
      reject: options.reject,
    });
  }

  onAccept(): void {
    const s = this.state();
    this.state.set(null);
    if (!s?.accept) return;
    globalThis.queueMicrotask(() => {
      void Promise.resolve(s.accept());
    });
  }

  onReject(): void {
    const s = this.state();
    this.state.set(null);
    if (!s?.reject) return;
    globalThis.queueMicrotask(() => {
      s.reject?.();
    });
  }
}

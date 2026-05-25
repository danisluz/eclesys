import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messages = inject(MessageService);

  success(message: string, _action?: string, _config?: unknown) {
    this.messages.add({ severity: 'success', summary: 'Sucesso', detail: message, life: 3000 });
  }

  error(message: string, _action?: string, _config?: unknown) {
    this.messages.add({ severity: 'error', summary: 'Erro', detail: message, life: 5000 });
  }

  warn(message: string, _action?: string, _config?: unknown) {
    this.messages.add({ severity: 'warn', summary: 'Atenção', detail: message, life: 4500 });
  }

  info(message: string, _action?: string, _config?: unknown) {
    this.messages.add({ severity: 'info', summary: 'Informação', detail: message, life: 3500 });
  }

  fromError(error: unknown, fallback = 'Ocorreu um erro inesperado.') {
    const message = (error as any)?.error?.message ?? fallback;
    this.error(message);
  }
}

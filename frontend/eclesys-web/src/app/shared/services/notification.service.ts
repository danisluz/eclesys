import { Injectable, computed, signal } from '@angular/core';

export type NotificationSeverity = 'success' | 'error' | 'warn' | 'info';

export interface NotificationConfig {
  title?: string;
  duration?: number;
  sticky?: boolean;
  closable?: boolean;
  key?: string;
  replace?: boolean;
}

export interface NotificationPayload extends NotificationConfig {
  severity: NotificationSeverity;
  message: string;
}

export interface NotificationItem {
  id: string;
  key: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  closable: boolean;
  sticky: boolean;
  duration: number;
}

type LegacyNotificationArg = NotificationConfig | string | undefined;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly defaultToastKey = 'app-toast';
  private readonly notificationsSignal = signal<NotificationItem[]>([]);
  readonly notifications = computed(() => this.notificationsSignal());

  private readonly defaultsBySeverity: Record<
    NotificationSeverity,
    Required<Pick<NotificationConfig, 'title' | 'duration' | 'sticky' | 'closable' | 'replace'>>
  > = {
    success: {
      title: 'Sucesso',
      duration: 3000,
      sticky: false,
      closable: true,
      replace: true,
    },
    error: {
      title: 'Erro',
      duration: 5000,
      sticky: false,
      closable: true,
      replace: true,
    },
    warn: {
      title: 'Atenção',
      duration: 4500,
      sticky: false,
      closable: true,
      replace: true,
    },
    info: {
      title: 'Informação',
      duration: 3500,
      sticky: false,
      closable: true,
      replace: true,
    },
  };

  private readonly clearTimerById = new Map<string, ReturnType<typeof globalThis.setTimeout>>();

  success(
    message: string,
    configOrLegacyAction?: LegacyNotificationArg,
    legacyConfig?: NotificationConfig,
  ): void {
    this.notify(
      this.buildPayload('success', message, configOrLegacyAction, legacyConfig),
    );
  }

  error(
    message: string,
    configOrLegacyAction?: LegacyNotificationArg,
    legacyConfig?: NotificationConfig,
  ): void {
    this.notify(
      this.buildPayload('error', message, configOrLegacyAction, legacyConfig),
    );
  }

  warn(
    message: string,
    configOrLegacyAction?: LegacyNotificationArg,
    legacyConfig?: NotificationConfig,
  ): void {
    this.notify(
      this.buildPayload('warn', message, configOrLegacyAction, legacyConfig),
    );
  }

  info(
    message: string,
    configOrLegacyAction?: LegacyNotificationArg,
    legacyConfig?: NotificationConfig,
  ): void {
    this.notify(
      this.buildPayload('info', message, configOrLegacyAction, legacyConfig),
    );
  }

  notify(payload: NotificationPayload): void {
    const defaults = this.defaultsBySeverity[payload.severity];
    const key = payload.key ?? this.defaultToastKey;
    const duration = payload.duration ?? defaults.duration;
    const sticky = payload.sticky ?? defaults.sticky;
    const closable = payload.closable ?? defaults.closable;
    const replace = payload.replace ?? defaults.replace;
    const title = payload.title ?? defaults.title;

    if (replace) {
      this.clear(key);
    }

    const notification: NotificationItem = {
      id: this.generateId(),
      key,
      severity: payload.severity,
      title,
      message: payload.message,
      closable,
      sticky,
      duration,
    };

    this.notificationsSignal.update((current) => [...current, notification]);

    if (!sticky && duration > 0) {
      const timerId = globalThis.setTimeout(() => {
        this.dismiss(notification.id);
      }, duration);

      this.clearTimerById.set(notification.id, timerId);
    }
  }

  dismiss(notificationId: string): void {
    this.cancelScheduledClear(notificationId);
    this.notificationsSignal.update((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );
  }

  clear(key = this.defaultToastKey): void {
    const notifications = this.notificationsSignal();
    for (const notification of notifications) {
      if (notification.key === key) {
        this.cancelScheduledClear(notification.id);
      }
    }

    this.notificationsSignal.update((current) =>
      current.filter((notification) => notification.key !== key),
    );
  }

  fromError(
    error: unknown,
    fallback = 'Ocorreu um erro inesperado.',
    config?: NotificationConfig,
  ): void {
    const message = (error as any)?.error?.message ?? fallback;
    this.error(message, config);
  }

  private buildPayload(
    severity: NotificationSeverity,
    message: string,
    configOrLegacyAction?: LegacyNotificationArg,
    legacyConfig?: NotificationConfig,
  ): NotificationPayload {
    const config = this.resolveConfig(configOrLegacyAction, legacyConfig);
    return {
      severity,
      message,
      ...config,
    };
  }

  private resolveConfig(
    configOrLegacyAction?: LegacyNotificationArg,
    legacyConfig?: NotificationConfig,
  ): NotificationConfig | undefined {
    if (this.isNotificationConfig(configOrLegacyAction)) {
      return configOrLegacyAction;
    }

    if (legacyConfig) {
      return legacyConfig;
    }

    return undefined;
  }

  private isNotificationConfig(
    value: LegacyNotificationArg,
  ): value is NotificationConfig {
    return typeof value === 'object' && value !== null;
  }

  private cancelScheduledClear(notificationId: string): void {
    const timerId = this.clearTimerById.get(notificationId);
    if (!timerId) {
      return;
    }
    globalThis.clearTimeout(timerId);
    this.clearTimerById.delete(notificationId);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

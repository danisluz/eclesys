import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { NotificationSnackbarComponent, NotificationType, NotificationSnackbarData } from '../ui/notification-snackbar/notification-snackbar.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(message: string, action: string = 'OK', config?: MatSnackBarConfig) {
    this.open(message, 'success', action, config);
  }

  error(message: string, action: string = 'Fechar', config?: MatSnackBarConfig) {
    this.open(message, 'error', action, config);
  }

  warn(message: string, action: string = 'Fechar', config?: MatSnackBarConfig) {
    this.open(message, 'warn', action, config);
  }

  info(message: string, action: string = 'OK', config?: MatSnackBarConfig) {
    this.open(message, 'info', action, config);
  }

  fromError(error: any, fallback: string = 'Ocorreu um erro inesperado.') {
    const message = error?.error?.message ?? fallback;
    this.error(message);
  }

  private open(
    message: string,
    type: NotificationType,
    action: string,
    config?: MatSnackBarConfig,
  ) {
    const duration = this.resolveDuration(type, config?.duration);
    const panelClass = this.resolvePanelClass(type, config?.panelClass);

    const data: NotificationSnackbarData = {
      message,
      type,
      actionLabel: action,
    };

    this.snackBar.openFromComponent(NotificationSnackbarComponent, {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      ...config,
      panelClass,
      data,
    });
  }

  private resolveDuration(type: NotificationType, override?: number) {
    if (override !== undefined) return override;
    switch (type) {
      case 'success':
        return 3000;
      case 'info':
        return 3500;
      case 'warn':
        return 4500;
      case 'error':
      default:
        return 5000;
    }
  }

  private resolvePanelClass(
    type: NotificationType,
    panelClass?: string | string[],
  ): string[] {
    const typeClass = this.panelClassFor(type);
    const normalized = Array.isArray(panelClass)
      ? panelClass
      : panelClass
        ? [panelClass]
        : [];
    return ['snackbar-base', typeClass, ...normalized];
  }

  private panelClassFor(type: NotificationType) {
    switch (type) {
      case 'success':
        return 'snackbar-success';
      case 'info':
        return 'snackbar-info';
      case 'warn':
        return 'snackbar-warning';
      case 'error':
      default:
        return 'snackbar-error';
    }
  }
}

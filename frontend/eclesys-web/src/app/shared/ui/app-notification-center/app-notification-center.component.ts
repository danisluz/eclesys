import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationItem, NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  templateUrl: './app-notification-center.component.html',
  styleUrl: './app-notification-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNotificationCenterComponent {
  readonly notificationService = inject(NotificationService);

  trackById(_index: number, notification: NotificationItem): string {
    return notification.id;
  }

  dismiss(notificationId: string): void {
    this.notificationService.dismiss(notificationId);
  }

  iconClass(severity: NotificationItem['severity']): string {
    switch (severity) {
      case 'success':
        return 'pi pi-check';
      case 'error':
        return 'pi pi-times-circle';
      case 'warn':
        return 'pi pi-exclamation-triangle';
      case 'info':
      default:
        return 'pi pi-info-circle';
    }
  }
}

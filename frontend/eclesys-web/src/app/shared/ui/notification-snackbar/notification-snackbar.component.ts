import { Component, Inject } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type NotificationType = 'success' | 'error' | 'warn' | 'info';

export type NotificationSnackbarData = {
  message: string;
  type: NotificationType;
  actionLabel?: string;
};

@Component({
  standalone: true,
  selector: 'app-notification-snackbar',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './notification-snackbar.component.html',
  styleUrls: ['./notification-snackbar.component.scss'],
})
export class NotificationSnackbarComponent {
  constructor(
    private snackBarRef: MatSnackBarRef<NotificationSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationSnackbarData,
  ) {}

  get icon(): string {
    switch (this.data.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  }

  get title(): string {
    switch (this.data.type) {
      case 'success':
        return 'Sucesso';
      case 'error':
        return 'Erro';
      case 'warn':
        return 'Atenção';
      case 'info':
      default:
        return 'Informação';
    }
  }

  closeWithAction() {
    this.snackBarRef.dismissWithAction();
  }
}

import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

export interface ConfirmDialogData {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [ButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  private readonly ref = inject(DynamicDialogRef);
  readonly data = inject(DynamicDialogConfig).data as ConfirmDialogData;

  confirm(): void {
    this.ref.close(true);
  }

  cancel(): void {
    this.ref.close(false);
  }
}

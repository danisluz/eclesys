import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { MemberTransfer } from '../../../../../shared/models/member.model';

@Component({
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [FormsModule, ButtonModule, TextareaModule],
  templateUrl: './reject-dialog.component.html',
  styleUrls: ['./reject-dialog.component.scss'],
})
export class RejectDialogComponent {
  private readonly ref = inject(DynamicDialogRef);
  readonly data: { transfer: MemberTransfer } = inject(DynamicDialogConfig).data;

  reason = '';

  confirm(): void {
    if (this.reason && this.reason.trim().length > 0) {
      this.ref.close(this.reason.trim());
    }
  }

  cancel(): void {
    this.ref.close();
  }
}

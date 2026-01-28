import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MemberTransfer } from '../../../../../shared/models/member.model';

@Component({
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './reject-dialog.component.html',
  styleUrls: ['./reject-dialog.component.scss'],

})
export class RejectDialogComponent {
  dialogRef = inject(MatDialogRef<RejectDialogComponent>);
  data: { transfer: MemberTransfer } = inject(MAT_DIALOG_DATA);

  reason = '';

  confirm(): void {
    if (this.reason && this.reason.trim().length > 0) {
      this.dialogRef.close(this.reason.trim());
    }
  }
}

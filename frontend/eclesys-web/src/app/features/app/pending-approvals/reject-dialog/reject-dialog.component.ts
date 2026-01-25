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
import { MemberTransfer } from '../../../../shared/models/member.model';

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
  template: `
    <h2 mat-dialog-title>Rejeitar Transferência</h2>

    <mat-dialog-content>
      <p class="dialog-description">
        Você está rejeitando a transferência de
        <strong>{{ data.transfer.memberName }}</strong>
      </p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Motivo da rejeição</mat-label>
        <textarea
          matInput
          [(ngModel)]="reason"
          rows="4"
          placeholder="Explique o motivo da rejeição..."
          required
        ></textarea>
        <mat-hint>Este motivo será visível para o solicitante</mat-hint>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button
        mat-flat-button
        color="warn"
        [disabled]="!reason || reason.trim().length === 0"
        (click)="confirm()"
      >
        Rejeitar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-description {
        margin-bottom: 16px;
        color: var(--md-sys-color-on-surface-variant);
      }

      .full-width {
        width: 100%;
      }

      mat-dialog-content {
        min-width: 400px;
      }
    `,
  ],
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

import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { UsersStore } from '../../data/users.store';
import { UserDto } from '../../models/user.models';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ResetPasswordDialogData {
  user: UserDto;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss'],
})
export class ResetPasswordDialogComponent {
  usersStore = inject(UsersStore);
  dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);
  dialogData = inject<ResetPasswordDialogData>(MAT_DIALOG_DATA);
  formBuilder = inject(FormBuilder);
  snackBar = inject(MatSnackBar);

  isSubmitting = signal(false);

  formGroup = this.formBuilder.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.isSubmitting()) return;

    this.usersStore.clearResetPasswordError();

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const newPassword = this.formGroup.controls.newPassword.value!;
    const confirmPassword = this.formGroup.controls.confirmPassword.value!;

    if (newPassword !== confirmPassword) {
      this.usersStore.setResetPasswordError('As senhas não conferem.');
      return;
    }

    this.isSubmitting.set(true);

    const success = await this.usersStore.resetUserPassword(
      this.dialogData.user.id,
      newPassword,
    );

    this.isSubmitting.set(false);

    if (success) {
      this.snackBar.open(
        `Senha de ${this.dialogData.user.name} redefinida com sucesso`,
        'Fechar',
        { duration: 3000 },
      );

      this.dialogRef.close(true);
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

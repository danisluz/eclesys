import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
import { MatIcon } from '@angular/material/icon';
import { passwordMatchValidator } from '../../../../../shared/validators/password-match.validator';
import { NotificationService } from '../../../../../shared/services/notification.service';

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
    MatIcon,
  ],
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss'],
})
export class ResetPasswordDialogComponent {
  usersStore = inject(UsersStore);
  dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);
  dialogData = inject<ResetPasswordDialogData>(MAT_DIALOG_DATA);
  formBuilder = inject(FormBuilder);
  notificationService = inject(NotificationService);
  wasSubmitted = signal(false);

  isSubmitting = signal(false);

  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  newPasswordHasMinLength(): boolean {
    const newPasswordValue = this.formGroup.controls.newPassword.value;
    return (newPasswordValue ?? '').length >= 6;
  }

  isPasswordMismatch(): boolean {
    return this.formGroup.hasError('passwordMismatch');
  }

  confirmPasswordHasMinLength(): boolean {
    const confirmPasswordValue = this.formGroup.controls.confirmPassword.value;
    return (confirmPasswordValue ?? '').length >= 6;
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((value) => !value);
  }

  formGroup = this.formBuilder.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    },
    { validators: passwordMatchValidator },
  );

  async submit(): Promise<void> {
    this.wasSubmitted.set(true);

    if (this.isSubmitting()) return;

    this.usersStore.clearResetPasswordError();

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const newPassword = this.formGroup.controls.newPassword.value!;

    const success = await this.usersStore.resetUserPassword(
      this.dialogData.user.id,
      newPassword,
    );

    this.isSubmitting.set(false);

    if (success) {
      this.notificationService.success(
        `Senha de ${this.dialogData.user.name} redefinida com sucesso`,
      );

      this.dialogRef.close(true);
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

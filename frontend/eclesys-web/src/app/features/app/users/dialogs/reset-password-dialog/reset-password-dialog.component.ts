import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { UsersStore } from '../../data/users.store';
import { UserDto } from '../../models/user.models';
import { passwordMatchValidator } from '../../../../../shared/validators/password-match.validator';
import { NotificationService } from '../../../../../shared/services/notification.service';

export interface ResetPasswordDialogData {
  user: UserDto;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss'],
})
export class ResetPasswordDialogComponent {
  private readonly ref = inject(DynamicDialogRef);
  readonly dialogData = inject(DynamicDialogConfig).data as ResetPasswordDialogData;
  private readonly formBuilder = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  readonly usersStore = inject(UsersStore);

  isSubmitting = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  formGroup = this.formBuilder.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    },
    { validators: passwordMatchValidator },
  );

  toggleNewPasswordVisibility() {
    this.showNewPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((v) => !v);
  }

  async submit(): Promise<void> {
    if (this.isSubmitting()) return;
    this.usersStore.clearResetPasswordError();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const newPassword = this.formGroup.controls.newPassword.value!;
    const success = await this.usersStore.resetUserPassword(this.dialogData.user.id, newPassword);
    this.isSubmitting.set(false);
    if (success) {
      this.notificationService.success(`Senha de ${this.dialogData.user.name} redefinida com sucesso`);
      this.ref.close(true);
    }
  }

  close(): void {
    this.ref.close(false);
  }
}

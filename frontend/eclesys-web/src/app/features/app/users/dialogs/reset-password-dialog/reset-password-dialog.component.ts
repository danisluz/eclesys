import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { UsersStore } from '../../data/users.store';
import { UserDto } from '../../models/user.models';
import { passwordMatchValidator } from '../../../../../shared/validators/password-match.validator';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss'],
})
export class ResetPasswordDialogComponent {
  @Input() user!: UserDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

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
    const success = await this.usersStore.resetUserPassword(this.user.id, newPassword);
    this.isSubmitting.set(false);
    if (success) {
      this.notificationService.success(`Senha de ${this.user.name} redefinida com sucesso`);
      this.saved.emit();
    }
  }

  close(): void {
    this.cancelled.emit();
  }
}

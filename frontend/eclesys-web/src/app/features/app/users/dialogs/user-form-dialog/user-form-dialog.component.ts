import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { UsersStore } from '../../data/users.store';
import { CreateUserRequest, UserDto, UserRole } from '../../models/user.models';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, SelectModule, PasswordModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
})
export class UserFormDialogComponent {
  readonly usersStore = inject(UsersStore);
  private readonly formBuilder = inject(FormBuilder);

  @Output() saved = new EventEmitter<UserDto>();
  @Output() cancelled = new EventEmitter<void>();

  isSubmitting = signal(false);

  roleOptions: Array<{ value: UserRole; label: string }> = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SECRETARIA', label: 'Secretaria' },
    { value: 'LIDER', label: 'Líder' },
  ];

  formGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['SECRETARIA' as UserRole, [Validators.required]],
  });

  async submit(): Promise<void> {
    if (this.isSubmitting()) return;
    this.usersStore.clearCreateError();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const request: CreateUserRequest = {
      name: this.formGroup.controls.name.value!.trim(),
      email: this.formGroup.controls.email.value!.trim(),
      password: this.formGroup.controls.password.value!,
      role: this.formGroup.controls.role.value!,
    };
    const createdUser = await this.usersStore.createUser(request);
    this.isSubmitting.set(false);
    if (createdUser) {
      this.saved.emit(createdUser);
    }
  }

  close(): void {
    this.cancelled.emit();
  }
}

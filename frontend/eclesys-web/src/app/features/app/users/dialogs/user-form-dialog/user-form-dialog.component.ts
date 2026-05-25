import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { UsersStore } from '../../data/users.store';
import { CreateUserRequest, UserRole } from '../../models/user.models';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, SelectModule, PasswordModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
})
export class UserFormDialogComponent {
  usersStore = inject(UsersStore);
  private ref = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);

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
      this.ref.close(createdUser);
    }
  }

  close(): void {
    this.ref.close(null);
  }
}

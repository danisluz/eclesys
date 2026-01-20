import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { UsersStore } from '../../data/users.store';
import { CreateUserRequest, UserRole } from '../../models/user.models';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
})
export class UserFormDialogComponent {
  usersStore = inject(UsersStore);
  dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  formBuilder = inject(FormBuilder);

  // caso queira evoluir depois p/ editar
  dialogData = inject(MAT_DIALOG_DATA, { optional: true }) as {
    mode?: 'create' | 'edit';
  } | null;

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
  console.log('[UserFormDialog] submit clicked');

  if (this.isSubmitting()) return;

  this.usersStore.clearCreateError();

  if (this.formGroup.invalid) {
    console.log('[UserFormDialog] invalid form', this.formGroup.value);
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
    this.dialogRef.close(createdUser);
  }
}


  close(): void {
    this.dialogRef.close(null);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import {
  FunctionRole,
  ScopeType,
} from '../../../../../shared/models/function-role.model';
import { FunctionRolesService } from '../../../../../shared/api/function-roles.service';

interface DialogData {
  mode: 'create' | 'edit';
  role?: FunctionRole;
  maxSortOrder?: number;
}

@Component({
  selector: 'app-function-role-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  templateUrl: './function-role-form-dialog.component.html',
  styleUrls: ['./function-role-form-dialog.component.scss'],

})
export class FunctionRoleFormDialogComponent {
  private fb = inject(FormBuilder);
  private service = inject(FunctionRolesService);
  private dialogRef = inject(MatDialogRef<FunctionRoleFormDialogComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  saving = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    scopeType: ['UNIT' as ScopeType, [Validators.required]],
    maxHolders: [null as number | null],
    sortOrder: [1, [Validators.required]],
    isActive: [true],
  });

  constructor() {
    if (this.data.mode === 'edit' && this.data.role) {
      this.form.patchValue({
        name: this.data.role.name,
        scopeType: this.data.role.scopeType,
        maxHolders: this.data.role.maxHolders,
        sortOrder: this.data.role.sortOrder,
        isActive: this.data.role.isActive,
      });
    } else if (
      this.data.mode === 'create' &&
      this.data.maxSortOrder !== undefined
    ) {
      this.form.patchValue({
        sortOrder: this.data.maxSortOrder + 1,
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) return;

    this.saving.set(true);

    const request = this.form.value;

    const operation =
      this.data.mode === 'create'
        ? this.service.create(request as any)
        : this.service.update(this.data.role!.id, request as any);

    operation.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}

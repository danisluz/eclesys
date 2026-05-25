import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { FunctionRole, ScopeType } from '../../../../../shared/models/function-role.model';
import { FunctionRolesService } from '../../../../../shared/api/function-roles.service';

interface DialogData {
  mode: 'create' | 'edit';
  role?: FunctionRole;
  maxSortOrder?: number;
}

@Component({
  selector: 'app-function-role-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule, SelectModule],
  templateUrl: './function-role-form-dialog.component.html',
  styleUrls: ['./function-role-form-dialog.component.scss'],
})
export class FunctionRoleFormDialogComponent {
  private fb = inject(FormBuilder);
  private service = inject(FunctionRolesService);
  private ref = inject(DynamicDialogRef);
  data = inject(DynamicDialogConfig).data as DialogData;

  saving = signal(false);

  scopeOptions = [
    { label: 'Unidade Organizacional', value: 'UNIT' },
    { label: 'Ministério', value: 'MINISTRY' },
    { label: 'Ambos', value: 'BOTH' },
  ];

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
    } else if (this.data.mode === 'create' && this.data.maxSortOrder !== undefined) {
      this.form.patchValue({ sortOrder: this.data.maxSortOrder + 1 });
    }
  }

  cancel() { this.ref.close(); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const request = this.form.value;
    const operation = this.data.mode === 'create'
      ? this.service.create(request as any)
      : this.service.update(this.data.role!.id, request as any);
    operation.subscribe({
      next: () => { this.ref.close(true); },
      error: () => { this.saving.set(false); },
    });
  }
}

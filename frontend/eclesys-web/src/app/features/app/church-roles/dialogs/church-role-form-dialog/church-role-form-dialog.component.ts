import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChurchRole } from '../../../../../shared/models/church-role.model';
import { ChurchRolesService } from '../../../../../shared/api/church-roles.service';

interface DialogData {
  mode: 'create' | 'edit';
  role?: ChurchRole;
  maxSortOrder?: number;
}

@Component({
  selector: 'app-church-role-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './church-role-form-dialog.component.html',
  styleUrls: ['./church-role-form-dialog.component.scss'],
})
export class ChurchRoleFormDialogComponent {
  private fb = inject(FormBuilder);
  private service = inject(ChurchRolesService);
  private ref = inject(DynamicDialogRef);
  data = inject(DynamicDialogConfig).data as DialogData;

  saving = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    sortOrder: [1, [Validators.required]],
    isActive: [true],
  });

  constructor() {
    if (this.data.mode === 'edit' && this.data.role) {
      this.form.patchValue({
        name: this.data.role.name,
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

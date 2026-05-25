import { Component, inject, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { FunctionRole, ScopeType } from '../../../../../shared/models/function-role.model';
import { FunctionRolesService } from '../../../../../shared/api/function-roles.service';

@Component({
  selector: 'app-function-role-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule, SelectModule],
  templateUrl: './function-role-form-dialog.component.html',
  styleUrls: ['./function-role-form-dialog.component.scss'],
})
export class FunctionRoleFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FunctionRolesService);

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() role: FunctionRole | undefined;
  @Input() maxSortOrder = 0;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

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

  ngOnInit() {
    if (this.mode === 'edit' && this.role) {
      this.form.patchValue({
        name: this.role.name,
        scopeType: this.role.scopeType,
        maxHolders: this.role.maxHolders,
        sortOrder: this.role.sortOrder,
        isActive: this.role.isActive,
      });
    } else if (this.mode === 'create') {
      this.form.patchValue({ sortOrder: this.maxSortOrder + 1 });
    }
  }

  cancel() { this.cancelled.emit(); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const request = this.form.value;
    const operation = this.mode === 'create'
      ? this.service.create(request as any)
      : this.service.update(this.role!.id, request as any);
    operation.subscribe({
      next: () => { this.saved.emit(); },
      error: () => { this.saving.set(false); },
    });
  }
}

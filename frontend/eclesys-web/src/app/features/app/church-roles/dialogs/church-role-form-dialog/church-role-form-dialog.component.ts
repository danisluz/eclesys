import {
  Component,
  inject,
  signal,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChurchRole } from '../../../../../shared/models/church-role.model';
import { ChurchRolesService } from '../../../../../shared/api/church-roles.service';

@Component({
  selector: 'app-church-role-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './church-role-form-dialog.component.html',
  styleUrls: ['./church-role-form-dialog.component.scss'],
})
export class ChurchRoleFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ChurchRolesService);

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() role: ChurchRole | undefined;
  @Input() maxSortOrder = 0;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  saving = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    sortOrder: [1, [Validators.required]],
    isActive: [true],
  });

  ngOnChanges(): void {
    this.populateForm();
  }

  private populateForm(): void {
    if (this.mode === 'edit' && this.role) {
      this.form.patchValue({
        name: this.role.name,
        sortOrder: this.role.sortOrder,
        isActive: this.role.isActive,
      });
    } else if (this.mode === 'create') {
      this.form.reset({
        name: '',
        sortOrder: this.maxSortOrder + 1,
        isActive: true,
      });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const request = this.form.value;
    const operation =
      this.mode === 'create'
        ? this.service.create(request as any)
        : this.service.update(this.role!.id, request as any);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}

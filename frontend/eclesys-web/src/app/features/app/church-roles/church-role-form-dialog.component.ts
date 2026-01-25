import { Component, inject, signal, effect } from '@angular/core';
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
import { ChurchRole } from '../../../shared/models/church-role.model';
import { ChurchRolesService } from '../../../shared/api/church-roles.service';

interface DialogData {
  mode: 'create' | 'edit';
  role?: ChurchRole;
  maxSortOrder?: number;
}

@Component({
  selector: 'app-church-role-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Novo Cargo' : 'Editar Cargo' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nome do Cargo</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ex: Pastor, Evangelista, Diácono"
          />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Nome é obrigatório</mat-error>
          }
          @if (form.controls.name.hasError('maxlength')) {
            <mat-error>Máximo 60 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Ordem de Exibição</mat-label>
          <input
            matInput
            type="number"
            formControlName="sortOrder"
            placeholder="1"
          />
          @if (form.controls.sortOrder.hasError('required')) {
            <mat-error>Ordem é obrigatória</mat-error>
          }
          <mat-hint>Define a ordem de exibição na lista</mat-hint>
        </mat-form-field>

        <mat-checkbox formControlName="isActive"> Cargo ativo </mat-checkbox>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || saving()"
        (click)="save()"
      >
        {{ saving() ? 'Salvando...' : 'Salvar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-form-field {
        margin-bottom: 1rem;
      }
      .w-full {
        width: 100%;
      }
    `,
  ],
})
export class ChurchRoleFormDialogComponent {
  private fb = inject(FormBuilder);
  private service = inject(ChurchRolesService);
  private dialogRef = inject(MatDialogRef<ChurchRoleFormDialogComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);

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

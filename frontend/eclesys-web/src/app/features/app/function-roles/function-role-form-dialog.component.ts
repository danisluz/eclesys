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
} from '../../../shared/models/function-role.model';
import { FunctionRolesService } from '../../../shared/api/function-roles.service';

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
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Nova Função' : 'Editar Função' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nome da Função</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ex: Líder, Secretário, Tesoureiro"
          />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Nome é obrigatório</mat-error>
          }
          @if (form.controls.name.hasError('maxlength')) {
            <mat-error>Máximo 60 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Escopo</mat-label>
          <mat-select formControlName="scopeType">
            <mat-option value="UNIT">Unidade Organizacional</mat-option>
            <mat-option value="MINISTRY">Ministério</mat-option>
            <mat-option value="BOTH">Ambos</mat-option>
          </mat-select>
          @if (form.controls.scopeType.hasError('required')) {
            <mat-error>Escopo é obrigatório</mat-error>
          }
          <mat-hint>Define onde a função pode ser exercida</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Limite de Pessoas (opcional)</mat-label>
          <input
            matInput
            type="number"
            formControlName="maxHolders"
            placeholder="Ex: 1 para Tesoureiro"
          />
          <mat-hint>Deixe vazio para ilimitado</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Ordem de Exibição</mat-label>
          <input matInput type="number" formControlName="sortOrder" />
          @if (form.controls.sortOrder.hasError('required')) {
            <mat-error>Ordem é obrigatória</mat-error>
          }
          <mat-hint>Define a ordem de exibição na lista</mat-hint>
        </mat-form-field>

        <mat-checkbox formControlName="isActive"> Função ativa </mat-checkbox>
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

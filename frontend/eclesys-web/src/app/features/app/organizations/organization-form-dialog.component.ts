import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  OrganizationUnit,
  OrganizationUnitType,
  OrganizationUnitStatus,
  CreateOrganizationUnitRequest,
  UpdateOrganizationUnitRequest,
} from '../../../shared/api/organization-unit.model';

export interface OrganizationFormDialogData {
  mode: 'create' | 'edit';
  unit?: OrganizationUnit;
  parentId?: string;
  parentType?: OrganizationUnitType;
  allUnits?: OrganizationUnit[];
}

@Component({
  standalone: true,
  selector: 'app-organization-form-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Nova Unidade' : 'Editar Unidade' }}
    </h2>

    <mat-dialog-content>
      <form #form="ngForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome</mat-label>
          <input
            matInput
            [(ngModel)]="name"
            name="name"
            required
            minlength="3"
            #nameInput="ngModel"
            [class.input-error]="nameInput.invalid && nameInput.touched"
          />
          @if (nameInput.invalid && nameInput.touched) {
            <mat-error>Nome é obrigatório (mínimo 3 caracteres)</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Código</mat-label>
          <input
            matInput
            [(ngModel)]="code"
            name="code"
            required
            minlength="2"
            #codeInput="ngModel"
            [class.input-error]="codeInput.invalid && codeInput.touched"
          />
          @if (codeInput.invalid && codeInput.touched) {
            <mat-error>Código é obrigatório (mínimo 2 caracteres)</mat-error>
          }
        </mat-form-field>

        @if (data.mode === 'create') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo</mat-label>
            <mat-select
              [(ngModel)]="type"
              name="type"
              required
              (selectionChange)="onTypeChange()"
            >
              @for (option of availableTypes(); track option.value) {
                <mat-option [value]="option.value">
                  {{ option.label }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (type !== OrganizationUnitType.CHURCH) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Unidade Pai</mat-label>
              <mat-select
                [(ngModel)]="parentId"
                name="parentId"
                [required]="availableParents().length > 0"
              >
                @if (availableParents().length === 0) {
                  <mat-option disabled>
                    Nenhuma unidade pai disponível. Crie uma "Sede Central"
                    primeiro.
                  </mat-option>
                }
                @for (parent of availableParents(); track parent.id) {
                  <mat-option [value]="parent.id">
                    {{ parent.name }} ({{ parent.code }})
                  </mat-option>
                }
              </mat-select>
              @if (availableParents().length === 0) {
                <mat-hint style="color: #f44336">
                  ⚠️ Você precisa criar uma "Sede Central" antes de criar
                  {{
                    type === OrganizationUnitType.SECTOR
                      ? 'um Setor'
                      : 'uma Congregação'
                  }}.
                </mat-hint>
              }
            </mat-form-field>
          }

          @if (type === OrganizationUnitType.CHURCH) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome do segundo nível</mat-label>
              <input
                matInput
                [(ngModel)]="sectorLabel"
                name="sectorLabel"
                placeholder="Ex: Setor, Distrito, Região"
                required
                minlength="3"
                #sectorLabelInput="ngModel"
                [class.input-error]="
                  sectorLabelInput.invalid && sectorLabelInput.touched
                "
              />
              @if (sectorLabelInput.invalid && sectorLabelInput.touched) {
                <mat-error>Nome do segundo nível é obrigatório</mat-error>
              }
              <mat-hint>Como sua denominação chama o segundo nível?</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome do terceiro nível</mat-label>
              <input
                matInput
                [(ngModel)]="congregationLabel"
                name="congregationLabel"
                placeholder="Ex: Congregação, Ponto de Pregação, Missão"
                required
                minlength="3"
                #congregationLabelInput="ngModel"
                [class.input-error]="
                  congregationLabelInput.invalid &&
                  congregationLabelInput.touched
                "
              />
              @if (
                congregationLabelInput.invalid && congregationLabelInput.touched
              ) {
                <mat-error>Nome do terceiro nível é obrigatório</mat-error>
              }
              <mat-hint>Como sua denominação chama o terceiro nível?</mat-hint>
            </mat-form-field>
          }
        }

        @if (type === OrganizationUnitType.CONGREGATION) {
          <div class="checkbox-field">
            <mat-checkbox [(ngModel)]="isHeadquarters" name="isHeadquarters">
              É sede do setor
            </mat-checkbox>
          </div>
        }

        @if (data.mode === 'edit') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="status" name="status" required>
              <mat-option [value]="OrganizationUnitStatus.ACTIVE">
                Ativa
              </mat-option>
              <mat-option [value]="OrganizationUnitStatus.INACTIVE">
                Inativa
              </mat-option>
            </mat-select>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!isFormValid() || isSaving()"
        (click)="save()"
      >
        @if (isSaving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          {{ data.mode === 'create' ? 'Criar' : 'Salvar' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 400px;
        padding: 1rem 0;
      }

      .full-width {
        width: 100%;
        margin-bottom: 1rem;
      }

      .checkbox-field {
        margin-bottom: 1rem;
      }

      .input-error {
        border-color: #f44336 !important;
      }

      mat-dialog-actions {
        padding: 1rem 0 0;
      }

      mat-spinner {
        display: inline-block;
        margin: 0;
      }
    `,
  ],
})
export class OrganizationFormDialogComponent {
  dialogRef = inject(MatDialogRef<OrganizationFormDialogComponent>);
  data = inject<OrganizationFormDialogData>(MAT_DIALOG_DATA);

  name = this.data.unit?.name ?? '';
  code = this.data.unit?.code ?? '';

  // Se tem parentType, define o tipo automaticamente
  type = this.data.unit?.type ?? this.getInitialType();

  parentId = this.data.parentId ?? this.data.unit?.parentId ?? null;
  isHeadquarters = this.data.unit?.isHeadquarters ?? false;
  status = this.data.unit?.status ?? OrganizationUnitStatus.ACTIVE;

  // Labels customizáveis (apenas para CHURCH)
  sectorLabel = this.data.unit?.sectorLabel ?? '';
  congregationLabel = this.data.unit?.congregationLabel ?? '';

  isSaving = signal(false);

  OrganizationUnitType = OrganizationUnitType;
  OrganizationUnitStatus = OrganizationUnitStatus;

  private getInitialType(): OrganizationUnitType {
    if (this.data.parentType === OrganizationUnitType.CHURCH) {
      return OrganizationUnitType.SECTOR;
    }
    if (this.data.parentType === OrganizationUnitType.SECTOR) {
      return OrganizationUnitType.CONGREGATION;
    }
    return OrganizationUnitType.CHURCH;
  }

  availableTypes = computed(() => {
    const church = this.data.allUnits?.find(
      (u) => u.type === OrganizationUnitType.CHURCH,
    );

    if (this.data.parentType === OrganizationUnitType.CHURCH) {
      return [
        {
          value: OrganizationUnitType.SECTOR,
          label: church?.sectorLabel ?? 'Setor',
        },
      ];
    }
    if (this.data.parentType === OrganizationUnitType.SECTOR) {
      return [
        {
          value: OrganizationUnitType.CONGREGATION,
          label: church?.congregationLabel ?? 'Congregação',
        },
      ];
    }
    return [
      { value: OrganizationUnitType.CHURCH, label: 'Sede Central' },
      {
        value: OrganizationUnitType.SECTOR,
        label: church?.sectorLabel ?? 'Setor',
      },
      {
        value: OrganizationUnitType.CONGREGATION,
        label: church?.congregationLabel ?? 'Congregação',
      },
    ];
  });

  availableParents = computed(() => {
    if (!this.data.allUnits) return [];

    if (this.type === OrganizationUnitType.SECTOR) {
      return this.data.allUnits.filter(
        (u) => u.type === OrganizationUnitType.CHURCH,
      );
    }
    if (this.type === OrganizationUnitType.CONGREGATION) {
      return this.data.allUnits.filter(
        (u) => u.type === OrganizationUnitType.SECTOR,
      );
    }
    return [];
  });

  onTypeChange() {
    // Não limpa parentId se foi passado explicitamente
    if (!this.data.parentId) {
      this.parentId = null;
    }
    this.isHeadquarters = false;
  }

  isFormValid(): boolean {
    // Valida campos básicos
    if (!this.name || this.name.length < 3) return false;
    if (!this.code || this.code.length < 2) return false;
    if (!this.type) return false;

    // Se for CHURCH, valida labels personalizados
    if (this.type === OrganizationUnitType.CHURCH) {
      if (!this.sectorLabel || this.sectorLabel.length < 3) return false;
      if (!this.congregationLabel || this.congregationLabel.length < 3)
        return false;
    }

    // Se NÃO for CHURCH, valida se precisa de pai
    if (this.type !== OrganizationUnitType.CHURCH) {
      // Se tem pais disponíveis, precisa selecionar um
      if (this.availableParents().length > 0 && !this.parentId) {
        return false;
      }
    }

    return true;
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (this.data.mode === 'create') {
      const request: CreateOrganizationUnitRequest = {
        name: this.name,
        code: this.code,
        type: this.type,
        parentId:
          this.type === OrganizationUnitType.CHURCH
            ? undefined
            : this.parentId!,
        isHeadquarters:
          this.type === OrganizationUnitType.CONGREGATION
            ? this.isHeadquarters
            : undefined,
        sectorLabel:
          this.type === OrganizationUnitType.CHURCH
            ? this.sectorLabel
            : undefined,
        congregationLabel:
          this.type === OrganizationUnitType.CHURCH
            ? this.congregationLabel
            : undefined,
      };
      this.dialogRef.close(request);
    } else {
      const request: UpdateOrganizationUnitRequest = {
        name: this.name,
        code: this.code,
        status: this.status,
      };
      this.dialogRef.close(request);
    }
  }
}

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
  templateUrl: './organization-form-dialog.component.html',
  styleUrls: ['./organization-form-dialog.component.scss'],

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

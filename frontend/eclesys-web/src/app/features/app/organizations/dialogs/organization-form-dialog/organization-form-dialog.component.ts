import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  OrganizationUnit,
  OrganizationUnitType,
  OrganizationUnitStatus,
  CreateOrganizationUnitRequest,
  UpdateOrganizationUnitRequest,
} from '../../../../../shared/api/organization-unit.model';

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
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, SelectModule, CheckboxModule, ProgressSpinnerModule],
  templateUrl: './organization-form-dialog.component.html',
  styleUrls: ['./organization-form-dialog.component.scss'],
})
export class OrganizationFormDialogComponent {
  private dialogRef = inject(DynamicDialogRef);
  data = inject(DynamicDialogConfig).data as OrganizationFormDialogData;

  name = this.data.unit?.name ?? '';
  code = this.data.unit?.code ?? '';
  type = this.data.unit?.type ?? this.getInitialType();
  parentId = this.data.parentId ?? this.data.unit?.parentId ?? null;
  isHeadquarters = this.data.unit?.isHeadquarters ?? false;
  status = this.data.unit?.status ?? OrganizationUnitStatus.ACTIVE;
  sectorLabel = this.data.unit?.sectorLabel ?? '';
  congregationLabel = this.data.unit?.congregationLabel ?? '';
  contactEmail = this.data.unit?.contactEmail ?? '';
  contactPhone = this.data.unit?.contactPhone ?? '';
  website = this.data.unit?.website ?? '';
  address = this.data.unit?.address ?? '';

  isSaving = signal(false);
  OrganizationUnitType = OrganizationUnitType;
  OrganizationUnitStatus = OrganizationUnitStatus;

  statusOptions = [
    { label: 'Ativa', value: OrganizationUnitStatus.ACTIVE },
    { label: 'Inativa', value: OrganizationUnitStatus.INACTIVE },
  ];

  private getInitialType(): OrganizationUnitType {
    if (this.data.parentType === OrganizationUnitType.CHURCH) return OrganizationUnitType.SECTOR;
    if (this.data.parentType === OrganizationUnitType.SECTOR) return OrganizationUnitType.CONGREGATION;
    return OrganizationUnitType.CHURCH;
  }

  availableTypes = computed(() => {
    const church = this.data.allUnits?.find((u) => u.type === OrganizationUnitType.CHURCH);
    if (this.data.parentType === OrganizationUnitType.CHURCH) {
      return [{ value: OrganizationUnitType.SECTOR, label: church?.sectorLabel ?? 'Setor' }];
    }
    if (this.data.parentType === OrganizationUnitType.SECTOR) {
      return [{ value: OrganizationUnitType.CONGREGATION, label: church?.congregationLabel ?? 'Congregação' }];
    }
    return [
      { value: OrganizationUnitType.CHURCH, label: 'Sede Central' },
      { value: OrganizationUnitType.SECTOR, label: church?.sectorLabel ?? 'Setor' },
      { value: OrganizationUnitType.CONGREGATION, label: church?.congregationLabel ?? 'Congregação' },
    ];
  });

  availableParents = computed(() => {
    if (!this.data.allUnits) return [];
    if (this.type === OrganizationUnitType.SECTOR) return this.data.allUnits.filter((u) => u.type === OrganizationUnitType.CHURCH);
    if (this.type === OrganizationUnitType.CONGREGATION) return this.data.allUnits.filter((u) => u.type === OrganizationUnitType.SECTOR);
    return [];
  });

  onTypeChange() {
    if (!this.data.parentId) this.parentId = null;
    this.isHeadquarters = false;
  }

  isFormValid(): boolean {
    if (!this.name || this.name.length < 3) return false;
    if (!this.code || this.code.length < 2) return false;
    if (!this.type) return false;
    if (this.type === OrganizationUnitType.CHURCH) {
      if (!this.sectorLabel || this.sectorLabel.length < 3) return false;
      if (!this.congregationLabel || this.congregationLabel.length < 3) return false;
    }
    if (this.type !== OrganizationUnitType.CHURCH) {
      if (this.availableParents().length > 0 && !this.parentId) return false;
    }
    return true;
  }

  cancel() { this.dialogRef.close(); }

  save() {
    if (this.data.mode === 'create') {
      const request: CreateOrganizationUnitRequest = {
        name: this.name,
        code: this.code,
        type: this.type,
        parentId: this.type === OrganizationUnitType.CHURCH ? undefined : this.parentId!,
        isHeadquarters: this.type === OrganizationUnitType.CONGREGATION ? this.isHeadquarters : undefined,
        sectorLabel: this.type === OrganizationUnitType.CHURCH ? this.sectorLabel : undefined,
        congregationLabel: this.type === OrganizationUnitType.CHURCH ? this.congregationLabel : undefined,
        contactEmail: this.type === OrganizationUnitType.CHURCH ? this.contactEmail : undefined,
        contactPhone: this.type === OrganizationUnitType.CHURCH ? this.contactPhone : undefined,
        website: this.type === OrganizationUnitType.CHURCH ? this.website : undefined,
        address: this.type === OrganizationUnitType.CHURCH ? this.address : undefined,
      };
      this.dialogRef.close(request);
    } else {
      const request: UpdateOrganizationUnitRequest = {
        name: this.name,
        code: this.code,
        status: this.status,
        contactEmail: this.type === OrganizationUnitType.CHURCH ? this.contactEmail : undefined,
        contactPhone: this.type === OrganizationUnitType.CHURCH ? this.contactPhone : undefined,
        website: this.type === OrganizationUnitType.CHURCH ? this.website : undefined,
        address: this.type === OrganizationUnitType.CHURCH ? this.address : undefined,
      };
      this.dialogRef.close(request);
    }
  }
}

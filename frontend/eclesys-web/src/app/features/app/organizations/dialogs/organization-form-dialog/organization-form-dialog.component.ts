import { Component, signal, computed, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  standalone: true,
  selector: 'app-organization-form-dialog',
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, SelectModule, CheckboxModule, ProgressSpinnerModule],
  templateUrl: './organization-form-dialog.component.html',
  styleUrls: ['./organization-form-dialog.component.scss'],
})
export class OrganizationFormDialogComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() unit: OrganizationUnit | undefined;
  @Input() defaultParentId: string | undefined;
  @Input() defaultParentType: OrganizationUnitType | undefined;
  @Input() allUnits: OrganizationUnit[] = [];
  @Output() saved = new EventEmitter<CreateOrganizationUnitRequest | UpdateOrganizationUnitRequest>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  code = '';
  type = OrganizationUnitType.CHURCH;
  parentId: string | null = null;
  isHeadquarters = false;
  status = OrganizationUnitStatus.ACTIVE;
  sectorLabel = '';
  congregationLabel = '';
  contactEmail = '';
  contactPhone = '';
  website = '';
  address = '';

  isSaving = signal(false);
  OrganizationUnitType = OrganizationUnitType;
  OrganizationUnitStatus = OrganizationUnitStatus;

  private readonly allUnitsSignal = signal<OrganizationUnit[]>([]);
  private readonly parentTypeSignal = signal<OrganizationUnitType | undefined>(undefined);
  private readonly typeSignal = signal<OrganizationUnitType>(OrganizationUnitType.CHURCH);

  statusOptions = [
    { label: 'Ativa', value: OrganizationUnitStatus.ACTIVE },
    { label: 'Inativa', value: OrganizationUnitStatus.INACTIVE },
  ];

  ngOnInit() {
    this.allUnitsSignal.set(this.allUnits);
    this.parentTypeSignal.set(this.defaultParentType);
    this.name = this.unit?.name ?? '';
    this.code = this.unit?.code ?? '';
    this.type = this.unit?.type ?? this.getInitialType();
    this.typeSignal.set(this.type);
    this.parentId = this.defaultParentId ?? this.unit?.parentId ?? null;
    this.isHeadquarters = this.unit?.isHeadquarters ?? false;
    this.status = this.unit?.status ?? OrganizationUnitStatus.ACTIVE;
    this.sectorLabel = this.unit?.sectorLabel ?? '';
    this.congregationLabel = this.unit?.congregationLabel ?? '';
    this.contactEmail = this.unit?.contactEmail ?? '';
    this.contactPhone = this.unit?.contactPhone ?? '';
    this.website = this.unit?.website ?? '';
    this.address = this.unit?.address ?? '';
  }

  private getInitialType(): OrganizationUnitType {
    if (this.defaultParentType === OrganizationUnitType.CHURCH) return OrganizationUnitType.SECTOR;
    if (this.defaultParentType === OrganizationUnitType.SECTOR) return OrganizationUnitType.CONGREGATION;
    return OrganizationUnitType.CHURCH;
  }

  availableTypes = computed(() => {
    const church = this.allUnitsSignal().find((u) => u.type === OrganizationUnitType.CHURCH);
    const parentType = this.parentTypeSignal();
    if (parentType === OrganizationUnitType.CHURCH) {
      return [{ value: OrganizationUnitType.SECTOR, label: church?.sectorLabel ?? 'Setor' }];
    }
    if (parentType === OrganizationUnitType.SECTOR) {
      return [{ value: OrganizationUnitType.CONGREGATION, label: church?.congregationLabel ?? 'Congregação' }];
    }
    return [
      { value: OrganizationUnitType.CHURCH, label: 'Sede Central' },
      { value: OrganizationUnitType.SECTOR, label: church?.sectorLabel ?? 'Setor' },
      { value: OrganizationUnitType.CONGREGATION, label: church?.congregationLabel ?? 'Congregação' },
    ];
  });

  availableParents = computed(() => {
    const type = this.typeSignal();
    if (type === OrganizationUnitType.SECTOR) return this.allUnitsSignal().filter((u) => u.type === OrganizationUnitType.CHURCH);
    if (type === OrganizationUnitType.CONGREGATION) return this.allUnitsSignal().filter((u) => u.type === OrganizationUnitType.SECTOR);
    return [];
  });

  onTypeChange() {
    this.typeSignal.set(this.type);
    if (!this.defaultParentId) this.parentId = null;
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

  cancel() { this.cancelled.emit(); }

  save() {
    if (this.mode === 'create') {
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
      this.saved.emit(request);
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
      this.saved.emit(request);
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { OrganizationUnit } from '../../../shared/api/organization-unit.model';

export type CongregationFilterDialogData = {
  title: string;
  congregations: OrganizationUnit[];
  selectedIds: string[];
};

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CheckboxModule, IconFieldModule, InputIconModule],
  templateUrl: './congregation-filter-dialog.component.html',
  styleUrls: ['./congregation-filter-dialog.component.scss'],
})
export class CongregationFilterDialogComponent {
  private ref = inject(DynamicDialogRef);
  data = inject(DynamicDialogConfig).data as CongregationFilterDialogData;

  searchTerm = signal('');
  selectedIds = signal<string[]>([...this.data.selectedIds]);

  filteredCongregations = computed(() => {
    const searchValue = this.normalize(this.searchTerm().trim());
    if (!searchValue) return this.data.congregations;
    return this.data.congregations.filter((org) => {
      const nameMatches = this.normalize(org.name).includes(searchValue);
      const parentMatches = org.parentName ? this.normalize(org.parentName).includes(searchValue) : false;
      return nameMatches || parentMatches;
    });
  });

  toggleSelection(congregationId: string, checked: boolean) {
    const current = this.selectedIds();
    if (checked) {
      if (!current.includes(congregationId)) this.selectedIds.set([...current, congregationId]);
      return;
    }
    this.selectedIds.set(current.filter((id) => id !== congregationId));
  }

  isSelected(congregationId: string) { return this.selectedIds().includes(congregationId); }
  clear() { this.selectedIds.set([]); }
  apply() { this.ref.close(this.selectedIds()); }
  cancel() { this.ref.close(null); }
  getLabel(org: OrganizationUnit) { return org.parentName ? `${org.name} (${org.parentName})` : org.name; }

  private normalize(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}

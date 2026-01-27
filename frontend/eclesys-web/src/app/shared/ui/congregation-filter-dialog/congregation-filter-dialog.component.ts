import { CommonModule } from '@angular/common';
import { Component, Inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { OrganizationUnit } from '../../../shared/api/organization-unit.model';

export type CongregationFilterDialogData = {
  title: string;
  congregations: OrganizationUnit[];
  selectedIds: string[];
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatFormFieldModule,
  ],
  templateUrl: './congregation-filter-dialog.component.html',
  styleUrls: ['./congregation-filter-dialog.component.scss'],
})
export class CongregationFilterDialogComponent {
  searchTerm = signal('');
  selectedIds = signal<string[]>([]);

  filteredCongregations = computed(() => {
    const searchValue = this.normalize(this.searchTerm().trim());
    if (!searchValue) return this.data.congregations;

    return this.data.congregations.filter((org) => {
      const nameMatches = this.normalize(org.name).includes(searchValue);
      const parentMatches = org.parentName
        ? this.normalize(org.parentName).includes(searchValue)
        : false;
      return nameMatches || parentMatches;
    });
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CongregationFilterDialogData,
    private dialogRef: MatDialogRef<CongregationFilterDialogComponent>,
  ) {
    this.selectedIds.set([...data.selectedIds]);
  }

  toggleSelection(congregationId: string, checked: boolean) {
    const current = this.selectedIds();
    if (checked) {
      if (!current.includes(congregationId)) {
        this.selectedIds.set([...current, congregationId]);
      }
      return;
    }

    this.selectedIds.set(current.filter((id) => id !== congregationId));
  }

  isSelected(congregationId: string) {
    return this.selectedIds().includes(congregationId);
  }

  clear() {
    this.selectedIds.set([]);
  }

  apply() {
    this.dialogRef.close(this.selectedIds());
  }

  cancel() {
    this.dialogRef.close(null);
  }

  getLabel(org: OrganizationUnit) {
    return org.parentName ? `${org.name} (${org.parentName})` : org.name;
  }

  private normalize(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}

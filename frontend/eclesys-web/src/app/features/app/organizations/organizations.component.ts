import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { OrganizationsService } from '../../../shared/api/organizations.service';
import {
  OrganizationUnit,
  OrganizationUnitType,
  CreateOrganizationUnitRequest,
  UpdateOrganizationUnitRequest,
} from '../../../shared/api/organization-unit.model';
import {
  OrganizationFormDialogComponent,
  OrganizationFormDialogData,
} from './organization-form-dialog.component';
import {
  ManageRolesDialogComponent,
  ManageRolesDialogData,
} from './manage-roles-dialog.component';
import {
  ViewHierarchyDialogComponent,
  ViewHierarchyDialogData,
} from './view-hierarchy-dialog.component';

@Component({
  standalone: true,
  selector: 'app-organizations',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatMenuModule,
    MatTableModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.scss'],
})
export class OrganizationsComponent implements OnInit {
  private organizationsService = inject(OrganizationsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  organizations = signal<OrganizationUnit[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  searchTerm = signal('');
  typeFilter = signal<OrganizationUnitType | 'ALL'>('ALL');
  headquartersFilter = signal<'ALL' | 'HEADQUARTERS' | 'NOT_HEADQUARTERS'>(
    'ALL',
  );

  filteredUnits = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const type = this.typeFilter();
    const hq = this.headquartersFilter();

    let units = this.getAllUnitsFlat();

    // Filtro por tipo
    if (type !== 'ALL') {
      units = units.filter((unit) => unit.type === type);
    }

    // Filtro por sede
    if (hq === 'HEADQUARTERS') {
      units = units.filter((unit) => unit.isHeadquarters);
    } else if (hq === 'NOT_HEADQUARTERS') {
      units = units.filter((unit) => !unit.isHeadquarters);
    }

    // Filtro por texto
    if (term) {
      units = units.filter((unit) => {
        const matchesName = unit.name?.toLowerCase().includes(term) ?? false;
        const matchesCode = unit.code?.toLowerCase().includes(term) ?? false;
        const matchesType = this.getTypeLabel(unit.type)
          .toLowerCase()
          .includes(term);
        const matchesParent = this.getParentName(unit)
          .toLowerCase()
          .includes(term);

        return matchesName || matchesCode || matchesType || matchesParent;
      });
    }

    return units;
  });

  hasActiveFilters = computed(() => {
    return (
      this.searchTerm() !== '' ||
      this.typeFilter() !== 'ALL' ||
      this.headquartersFilter() !== 'ALL'
    );
  });

  OrganizationUnitType = OrganizationUnitType;

  ngOnInit() {
    this.loadOrganizations();
  }

  private getRootChurch(): OrganizationUnit | undefined {
    return this.organizations().find(
      (org) => org.type === OrganizationUnitType.CHURCH,
    );
  }

  loadOrganizations() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.organizationsService.listAll().subscribe({
      next: (response) => {
        console.log('[Organizations] Loaded successfully:', response);
        this.organizations.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('[Organizations] Load failed:', error);
        const message =
          error?.error?.message ?? 'Erro ao carregar organizações';
        this.errorMessage.set(message);
        this.isLoading.set(false);
      },
    });
  }

  getTypeLabel(type: OrganizationUnitType): string {
    const church = this.getRootChurch();

    const labels = {
      [OrganizationUnitType.CHURCH]: 'Sede Central',
      [OrganizationUnitType.SECTOR]: church?.sectorLabel ?? 'Setor',
      [OrganizationUnitType.CONGREGATION]:
        church?.congregationLabel ?? 'Congregação',
    };
    return labels[type] || type;
  }

  getSectorLabel(): string {
    return this.getRootChurch()?.sectorLabel ?? 'Setor';
  }

  getCongregationLabel(): string {
    return this.getRootChurch()?.congregationLabel ?? 'Congregação';
  }

  getAllUnitsFlat(): OrganizationUnit[] {
    const result: OrganizationUnit[] = [];

    for (const church of this.organizations()) {
      result.push(church);
      if (church.children) {
        for (const sector of church.children) {
          result.push(sector);
          if (sector.children) {
            result.push(...sector.children);
          }
        }
      }
    }

    return result;
  }

  getParentName(unit: OrganizationUnit): string {
    if (unit.type === OrganizationUnitType.CHURCH) {
      return '—';
    }

    // Find parent for sectors and congregations
    for (const church of this.organizations()) {
      if (
        unit.type === OrganizationUnitType.SECTOR &&
        unit.parentId === church.id
      ) {
        return church.name;
      }
      if (church.children) {
        for (const sector of church.children) {
          if (
            unit.type === OrganizationUnitType.CONGREGATION &&
            unit.parentId === sector.id
          ) {
            return sector.name;
          }
        }
      }
    }

    return '—';
  }

  getHeadquartersLabel(type: OrganizationUnitType): string {
    if (type === OrganizationUnitType.CHURCH) {
      return 'Sede Principal';
    }
    if (type === OrganizationUnitType.CONGREGATION) {
      return `Sede ${this.getSectorLabel()}`;
    }
    return 'Sede';
  }

  getTypeIcon(type: OrganizationUnitType): string {
    const icons = {
      [OrganizationUnitType.CHURCH]: 'church',
      [OrganizationUnitType.SECTOR]: 'folder',
      [OrganizationUnitType.CONGREGATION]: 'people',
    };
    return icons[type] || 'location_on';
  }

  openCreateDialog(parentId?: string, parentType?: OrganizationUnitType) {
    const dialogData: OrganizationFormDialogData = {
      mode: 'create',
      parentId,
      parentType,
      allUnits: this.organizations(),
    };

    const dialogRef = this.dialog.open(OrganizationFormDialogComponent, {
      width: '500px',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .subscribe((request: CreateOrganizationUnitRequest) => {
        if (!request) return;

        this.organizationsService.create(request).subscribe({
          next: () => {
            this.snackBar.open('Unidade criada com sucesso', 'OK', {
              duration: 3000,
            });
            this.loadOrganizations();
          },
          error: (error) => {
            const message = error?.error?.message ?? 'Erro ao criar unidade';
            this.snackBar.open(message, 'OK', { duration: 5000 });
          },
        });
      });
  }

  openEditDialog(unit: OrganizationUnit) {
    const dialogData: OrganizationFormDialogData = {
      mode: 'edit',
      unit,
    };

    const dialogRef = this.dialog.open(OrganizationFormDialogComponent, {
      width: '500px',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .subscribe((request: UpdateOrganizationUnitRequest) => {
        if (!request) return;

        this.organizationsService.update(unit.id, request).subscribe({
          next: () => {
            this.snackBar.open('Unidade atualizada com sucesso', 'OK', {
              duration: 3000,
            });
            this.loadOrganizations();
          },
          error: (error) => {
            const message =
              error?.error?.message ?? 'Erro ao atualizar unidade';
            this.snackBar.open(message, 'OK', { duration: 5000 });
          },
        });
      });
  }

  deleteUnit(unit: OrganizationUnit) {
    if (!confirm(`Tem certeza que deseja excluir "${unit.name}"?`)) {
      return;
    }

    this.organizationsService.delete(unit.id).subscribe({
      next: () => {
        this.snackBar.open('Unidade excluída com sucesso', 'OK', {
          duration: 3000,
        });
        this.loadOrganizations();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Erro ao excluir unidade';
        this.snackBar.open(message, 'OK', { duration: 5000 });
      },
    });
  }

  openManageRolesDialog(unit: OrganizationUnit) {
    const dialogData: ManageRolesDialogData = {
      organizationUnitId: unit.id,
      organizationUnitName: unit.name,
    };

    const dialogRef = this.dialog.open(ManageRolesDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(() => {
      // Recarregar organizações para atualizar contadores
      this.loadOrganizations();
    });
  }

  openViewHierarchyDialog(rootOrganizationId?: string) {
    const dialogData: ViewHierarchyDialogData = {
      rootOrganizationId,
    };

    this.dialog.open(ViewHierarchyDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
    });
  }

  clearFilters() {
    this.searchTerm.set('');
    this.typeFilter.set('ALL');
    this.headquartersFilter.set('ALL');
  }
}

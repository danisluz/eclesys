import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

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

@Component({
  standalone: true,
  selector: 'app-organizations',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatMenuModule,
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
}

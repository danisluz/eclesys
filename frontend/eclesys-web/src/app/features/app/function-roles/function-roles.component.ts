import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FunctionRolesService } from '../../../shared/api/function-roles.service';
import {
  FunctionRole,
  ScopeType,
} from '../../../shared/models/function-role.model';
import { FunctionRoleFormDialogComponent } from './function-role-form-dialog.component';

@Component({
  selector: 'app-function-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSlideToggleModule,
    MatChipsModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Funções Administrativas</h1>
          <p class="page-subtitle">
            Gerencie as funções operacionais (Líder, Secretário, Tesoureiro,
            etc.)
          </p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nova Função
        </button>
      </div>

      <mat-card appearance="outlined">
        <mat-card-content>
          @if (loading()) {
            <p class="text-muted">Carregando...</p>
          } @else if (roles().length === 0) {
            <p class="text-muted">Nenhuma função cadastrada</p>
          } @else {
            <table mat-table [dataSource]="roles()" class="w-full">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nome</th>
                <td mat-cell *matCellDef="let role">{{ role.name }}</td>
              </ng-container>

              <ng-container matColumnDef="scopeType">
                <th mat-header-cell *matHeaderCellDef>Escopo</th>
                <td mat-cell *matCellDef="let role">
                  <mat-chip-set>
                    <mat-chip>{{ getScopeLabel(role.scopeType) }}</mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <ng-container matColumnDef="maxHolders">
                <th mat-header-cell *matHeaderCellDef class="w-32">Limite</th>
                <td mat-cell *matCellDef="let role">
                  {{ role.maxHolders ?? 'Ilimitado' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="sortOrder">
                <th mat-header-cell *matHeaderCellDef class="w-32">Ordem</th>
                <td mat-cell *matCellDef="let role">{{ role.sortOrder }}</td>
              </ng-container>

              <ng-container matColumnDef="isActive">
                <th mat-header-cell *matHeaderCellDef class="w-32">Ativo</th>
                <td mat-cell *matCellDef="let role">
                  <mat-slide-toggle
                    [checked]="role.isActive"
                    (change)="toggleActive(role, $event.checked)"
                  ></mat-slide-toggle>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="w-32">Ações</th>
                <td mat-cell *matCellDef="let role">
                  <button mat-icon-button (click)="openEditDialog(role)">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .w-32 {
        width: 8rem;
      }
      .w-full {
        width: 100%;
      }
      .text-muted {
        color: rgba(0, 0, 0, 0.6);
        padding: 2rem;
        text-align: center;
      }
    `,
  ],
})
export class FunctionRolesComponent implements OnInit {
  private service = inject(FunctionRolesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  roles = signal<FunctionRole[]>([]);
  loading = signal(true);

  displayedColumns = [
    'name',
    'scopeType',
    'maxHolders',
    'sortOrder',
    'isActive',
    'actions',
  ];

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loading.set(true);
    this.service.listAll().subscribe({
      next: (response) => {
        this.roles.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getScopeLabel(scopeType: ScopeType): string {
    const labels: Record<ScopeType, string> = {
      UNIT: 'Unidade',
      MINISTRY: 'Ministério',
      BOTH: 'Ambos',
    };
    return labels[scopeType];
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(FunctionRoleFormDialogComponent, {
      width: '600px',
      data: { mode: 'create', maxSortOrder: this.getMaxSortOrder() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.snackBar.open('Função criada com sucesso', 'Fechar', {
          duration: 3000,
        });
      }
    });
  }

  openEditDialog(role: FunctionRole) {
    const dialogRef = this.dialog.open(FunctionRoleFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', role },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.snackBar.open('Função atualizada com sucesso', 'Fechar', {
          duration: 3000,
        });
      }
    });
  }

  toggleActive(role: FunctionRole, isActive: boolean) {
    const originalValue = role.isActive;
    role.isActive = isActive;

    this.service.update(role.id, { isActive }).subscribe({
      next: () => {
        this.snackBar.open(
          isActive ? 'Função ativada' : 'Função desativada',
          'Fechar',
          { duration: 3000 },
        );
      },
      error: () => {
        role.isActive = originalValue;
        this.snackBar.open('Erro ao atualizar status', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  private getMaxSortOrder(): number {
    const orders = this.roles().map((r) => r.sortOrder);
    return orders.length > 0 ? Math.max(...orders) : 0;
  }
}

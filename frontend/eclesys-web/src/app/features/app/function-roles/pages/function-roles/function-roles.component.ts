import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { FunctionRolesService } from '../../../../../shared/api/function-roles.service';
import {
  FunctionRole,
  ScopeType,
} from '../../../../../shared/models/function-role.model';
import { FunctionRoleFormDialogComponent } from '../../dialogs/function-role-form-dialog/function-role-form-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

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
  templateUrl: './function-roles.component.html',
  styleUrls: ['./function-roles.component.scss'],

})
export class FunctionRolesComponent implements OnInit {
  private service = inject(FunctionRolesService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

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
        this.notificationService.success('Função criada com sucesso');
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
        this.notificationService.success('Função atualizada com sucesso');
      }
    });
  }

  toggleActive(role: FunctionRole, isActive: boolean) {
    const originalValue = role.isActive;
    role.isActive = isActive;

    this.service.update(role.id, { isActive }).subscribe({
      next: () => {
        this.notificationService.success(
          isActive ? 'Função ativada' : 'Função desativada',
        );
      },
      error: () => {
        role.isActive = originalValue;
        this.notificationService.error('Erro ao atualizar status');
      },
    });
  }

  private getMaxSortOrder(): number {
    const orders = this.roles().map((r) => r.sortOrder);
    return orders.length > 0 ? Math.max(...orders) : 0;
  }
}

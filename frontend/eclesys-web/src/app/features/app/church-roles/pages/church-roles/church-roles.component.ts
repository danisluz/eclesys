import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { ChurchRolesService } from '../../../../../shared/api/church-roles.service';
import { ChurchRole } from '../../../../../shared/models/church-role.model';
import { ChurchRoleFormDialogComponent } from '../../dialogs/church-role-form-dialog/church-role-form-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-church-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSlideToggleModule,
  ],
  templateUrl: './church-roles.component.html',
  styleUrls: ['./church-roles.component.scss'],

})
export class ChurchRolesComponent implements OnInit {
  private service = inject(ChurchRolesService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  roles = signal<ChurchRole[]>([]);
  loading = signal(true);

  displayedColumns = ['name', 'sortOrder', 'isActive', 'actions'];

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

  openCreateDialog() {
    const dialogRef = this.dialog.open(ChurchRoleFormDialogComponent, {
      width: '500px',
      data: { mode: 'create', maxSortOrder: this.getMaxSortOrder() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.notificationService.success('Cargo criado com sucesso');
      }
    });
  }

  openEditDialog(role: ChurchRole) {
    const dialogRef = this.dialog.open(ChurchRoleFormDialogComponent, {
      width: '500px',
      data: { mode: 'edit', role },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.notificationService.success('Cargo atualizado com sucesso');
      }
    });
  }

  toggleActive(role: ChurchRole, isActive: boolean) {
    const originalValue = role.isActive;
    role.isActive = isActive;

    this.service.update(role.id, { isActive }).subscribe({
      next: () => {
        this.notificationService.success(
          isActive ? 'Cargo ativado' : 'Cargo desativado',
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

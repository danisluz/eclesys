import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { ChurchRolesService } from '../../../../../shared/api/church-roles.service';
import { ChurchRole } from '../../../../../shared/models/church-role.model';
import { ChurchRoleFormDialogComponent } from '../../dialogs/church-role-form-dialog/church-role-form-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-church-roles',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    ToggleSwitchModule,
    TooltipModule,
  ],
  templateUrl: './church-roles.component.html',
  styleUrls: ['./church-roles.component.scss'],
})
export class ChurchRolesComponent implements OnInit {
  private readonly service = inject(ChurchRolesService);
  private readonly dialogService = inject(DialogService);
  private readonly notificationService = inject(NotificationService);

  roles = signal<ChurchRole[]>([]);
  loading = signal(true);

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
    const ref = this.dialogService.open(ChurchRoleFormDialogComponent, {
      header: 'Novo Cargo',
      width: '500px',
      data: { mode: 'create', maxSortOrder: this.getMaxSortOrder() },
    });
    ref?.onClose.subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.notificationService.success('Cargo criado com sucesso');
      }
    });
  }

  openEditDialog(role: ChurchRole) {
    const ref = this.dialogService.open(ChurchRoleFormDialogComponent, {
      header: 'Editar Cargo',
      width: '500px',
      data: { mode: 'edit', role },
    });
    ref?.onClose.subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.notificationService.success('Cargo atualizado com sucesso');
      }
    });
  }

  toggleActive(role: ChurchRole, isActive: boolean) {
    const originalValue = !isActive;
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

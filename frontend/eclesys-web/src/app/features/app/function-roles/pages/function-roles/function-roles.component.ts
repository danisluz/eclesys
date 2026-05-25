import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
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
    FormsModule,
    TableModule,
    ButtonModule,
    ToggleSwitchModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './function-roles.component.html',
  styleUrls: ['./function-roles.component.scss'],
})
export class FunctionRolesComponent implements OnInit {
  private readonly service = inject(FunctionRolesService);
  private readonly dialogService = inject(DialogService);
  private readonly notificationService = inject(NotificationService);

  roles = signal<FunctionRole[]>([]);
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

  getScopeLabel(scopeType: ScopeType): string {
    const labels: Record<ScopeType, string> = {
      UNIT: 'Unidade',
      MINISTRY: 'Ministério',
      BOTH: 'Ambos',
    };
    return labels[scopeType];
  }

  openCreateDialog() {
    const ref = this.dialogService.open(FunctionRoleFormDialogComponent, {
      header: 'Nova Função',
      width: '600px',
      data: { mode: 'create', maxSortOrder: this.getMaxSortOrder() },
    });
    ref?.onClose.subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.notificationService.success('Função criada com sucesso');
      }
    });
  }

  openEditDialog(role: FunctionRole) {
    const ref = this.dialogService.open(FunctionRoleFormDialogComponent, {
      header: 'Editar Função',
      width: '600px',
      data: { mode: 'edit', role },
    });
    ref?.onClose.subscribe((result) => {
      if (result) {
        this.loadRoles();
        this.notificationService.success('Função atualizada com sucesso');
      }
    });
  }

  toggleActive(role: FunctionRole, isActive: boolean) {
    const originalValue = !isActive;
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

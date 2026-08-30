import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FunctionRolesService } from '../../../../../shared/api/function-roles.service';
import { FunctionRole, ScopeType } from '../../../../../shared/models/function-role.model';
import { FunctionRoleFormDialogComponent } from '../../dialogs/function-role-form-dialog/function-role-form-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-function-roles',
  standalone: true,
  imports: [
    FormsModule,
    DrawerModule,
    TableModule,
    ButtonModule,
    ToggleSwitchModule,
    TagModule,
    TooltipModule,
    FunctionRoleFormDialogComponent,
  ],
  templateUrl: './function-roles.component.html',
  styleUrls: ['./function-roles.component.scss'],
})
export class FunctionRolesComponent implements OnInit {
  private readonly service = inject(FunctionRolesService);
  private readonly notificationService = inject(NotificationService);
  readonly drawerStyle = { width: '480px' };

  roles = signal<FunctionRole[]>([]);
  loading = signal(true);
  drawerVisible = signal(false);
  drawerMode = signal<'create' | 'edit'>('create');
  selectedRole = signal<FunctionRole | undefined>(undefined);

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
      error: () => { this.loading.set(false); },
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

  openCreateDrawer() {
    this.drawerMode.set('create');
    this.selectedRole.set(undefined);
    this.drawerVisible.set(true);
  }

  openEditDrawer(role: FunctionRole) {
    this.drawerMode.set('edit');
    this.selectedRole.set(role);
    this.drawerVisible.set(true);
  }

  onSaved() {
    this.drawerVisible.set(false);
    this.loadRoles();
    const msg = this.drawerMode() === 'create' ? 'Função criada com sucesso' : 'Função atualizada com sucesso';
    this.notificationService.success(msg);
  }

  onCancelled() {
    this.drawerVisible.set(false);
  }

  toggleActive(role: FunctionRole, isActive: boolean) {
    const originalValue = !isActive;
    this.service.update(role.id, { isActive }).subscribe({
      next: () => {
        this.notificationService.success(isActive ? 'Função ativada' : 'Função desativada');
      },
      error: () => {
        role.isActive = originalValue;
        this.notificationService.error('Erro ao atualizar status');
      },
    });
  }

  get maxSortOrder(): number {
    const orders = this.roles().map((r) => r.sortOrder);
    return orders.length > 0 ? Math.max(...orders) : 0;
  }
}

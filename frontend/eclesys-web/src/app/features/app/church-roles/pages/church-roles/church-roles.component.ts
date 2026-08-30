import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
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
    DrawerModule,
    TableModule,
    ButtonModule,
    ToggleSwitchModule,
    TooltipModule,
    ChurchRoleFormDialogComponent,
  ],
  templateUrl: './church-roles.component.html',
  styleUrls: ['./church-roles.component.scss'],
})
export class ChurchRolesComponent implements OnInit {
  private readonly service = inject(ChurchRolesService);
  private readonly notificationService = inject(NotificationService);
  readonly drawerStyle = { width: '480px' };

  roles = signal<ChurchRole[]>([]);
  loading = signal(true);
  drawerVisible = signal(false);
  drawerMode = signal<'create' | 'edit'>('create');
  selectedRole = signal<ChurchRole | undefined>(undefined);

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

  openCreateDrawer() {
    this.drawerMode.set('create');
    this.selectedRole.set(undefined);
    this.drawerVisible.set(true);
  }

  openEditDrawer(role: ChurchRole) {
    this.drawerMode.set('edit');
    this.selectedRole.set(role);
    this.drawerVisible.set(true);
  }

  onSaved() {
    this.drawerVisible.set(false);
    this.loadRoles();
    const msg = this.drawerMode() === 'create' ? 'Cargo criado com sucesso' : 'Cargo atualizado com sucesso';
    this.notificationService.success(msg);
  }

  onCancelled() {
    this.drawerVisible.set(false);
  }

  toggleActive(role: ChurchRole, isActive: boolean) {
    const originalValue = !isActive;
    this.service.update(role.id, { isActive }).subscribe({
      next: () => {
        this.notificationService.success(isActive ? 'Cargo ativado' : 'Cargo desativado');
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

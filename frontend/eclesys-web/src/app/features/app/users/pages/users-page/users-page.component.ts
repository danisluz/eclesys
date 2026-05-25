import { Component, inject, ViewChild, afterNextRender, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule, Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { UsersStore } from '../../data/users.store';
import { UserFormDialogComponent } from '../../dialogs/user-form-dialog/user-form-dialog.component';
import { UserAvatarComponent } from '../../../../../shared/ui/user-avatar/user-avatar.component';
import { UserDto } from '../../models/user.models';
import { AuthStore } from '../../../../../core/auth/auth.store';
import { ConfirmDialogComponent } from '../../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { ResetPasswordDialogComponent } from '../../dialogs/reset-password-dialog/reset-password-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    DrawerModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToggleSwitchModule,
    TooltipModule,
    MenuModule,
    ProgressSpinnerModule,
    UserAvatarComponent,
    UserFormDialogComponent,
    ResetPasswordDialogComponent,
  ],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.scss'],
})
export class UsersPageComponent {
  readonly usersStore = inject(UsersStore);
  readonly authStore = inject(AuthStore);
  private readonly dialogService = inject(DialogService);
  private readonly notificationService = inject(NotificationService);

  @ViewChild('userMenu') userMenu!: Menu;
  userMenuItems: MenuItem[] = [];

  createDrawerVisible = signal(false);
  resetPasswordDrawerVisible = signal(false);
  selectedUser = signal<UserDto | undefined>(undefined);

  constructor() {
    afterNextRender(() => {
      this.usersStore.loadUsers();
    });
  }

  isAdmin(): boolean {
    return this.authStore.me()?.role === 'ADMIN';
  }

  isMasterUser(user: UserDto): boolean {
    const me = this.authStore.me();
    if (!me) return false;
    return user.email === me.email;
  }

  openUserMenu(event: Event, user: UserDto): void {
    this.userMenuItems = [
      {
        label: 'Redefinir senha',
        icon: 'pi pi-lock',
        command: () => this.openResetPasswordDrawer(user),
      },
    ];
    this.userMenu.toggle(event);
  }

  openCreateDrawer(): void {
    this.usersStore.clearCreateError();
    this.createDrawerVisible.set(true);
  }

  onUserSaved(): void {
    this.createDrawerVisible.set(false);
    this.notificationService.success('Usuário criado com sucesso');
  }

  reload(): void {
    this.usersStore.loadUsers();
  }

  onToggleStatus(user: UserDto, newValue: boolean): void {
    const previousValue = !newValue;

    const ref = this.dialogService.open(ConfirmDialogComponent, {
      header: newValue ? 'Ativar usuário' : 'Desativar usuário',
      data: {
        title: newValue ? 'Ativar usuário' : 'Desativar usuário',
        message: `Deseja ${newValue ? 'ativar' : 'desativar'} ${user.name}?`,
        confirmColor: newValue ? 'primary' : 'warn',
      },
    });

    if (!ref) {
      user.isActive = previousValue;
      return;
    }

    ref.onClose.subscribe(async (confirmed) => {
      if (!confirmed) {
        user.isActive = previousValue;
        return;
      }
      const success = await this.usersStore.updateStatus(user.id, newValue);
      if (!success) {
        user.isActive = previousValue;
        return;
      }
      this.notificationService.success(
        newValue ? `Usuário ${user.name} ativado com sucesso` : `Usuário ${user.name} desativado com sucesso`,
      );
    });
  }

  openResetPasswordDrawer(user: UserDto): void {
    this.usersStore.clearResetPasswordError();
    this.selectedUser.set(user);
    this.resetPasswordDrawerVisible.set(true);
  }
}

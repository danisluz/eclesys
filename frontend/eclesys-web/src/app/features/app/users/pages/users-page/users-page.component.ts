import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { afterNextRender } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';

import { UsersStore } from '../../data/users.store';
import { UserFormDialogComponent } from '../../dialogs/user-form-dialog/user-form-dialog.component';
import { UserAvatarComponent } from '../../../../../shared/ui/user-avatar/user-avatar.component';
import { UserDto } from '../../models/user.models';
import { AuthStore } from '../../../../../core/auth/auth.store';
import { ConfirmDialogComponent } from '../../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { ResetPasswordDialogComponent } from '../../dialogs/reset-password-dialog/reset-password-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    UserAvatarComponent,
    MatSlideToggleModule,
    MatMenuModule,
    MatTooltipModule,
    MatTableModule,
  ],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.scss'],
})
export class UsersPageComponent {
  usersStore = inject(UsersStore);
  matDialog = inject(MatDialog);
  authStore = inject(AuthStore);
  notificationService = inject(NotificationService);

  displayedColumns = ['user', 'role', 'status', 'actions'];

  constructor() {
    afterNextRender(() => {
      // sem ngOnInit: carrega assim que a view estabiliza
      this.usersStore.loadUsers();
    });
  }

  isAdmin(): boolean {
    return this.authStore.me()?.role === 'ADMIN';
  }

  openCreateDialog(): void {
    this.usersStore.clearCreateError();

    const dialogRef = this.matDialog.open(UserFormDialogComponent, {
      width: '640px',
      maxWidth: '92vw',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe();
  }

  reload(): void {
    this.usersStore.loadUsers();
  }

  onToggleStatus(user: UserDto, event: MatSlideToggleChange): void {
    const previousValue = user.isActive;
    const newValue = event.checked;

    this.matDialog
      .open(ConfirmDialogComponent, {
        data: {
          title: newValue ? 'Ativar usuário' : 'Desativar usuário',
          message: `Deseja ${newValue ? 'ativar' : 'desativar'} ${user.name}?`,
          confirmColor: newValue ? 'primary' : 'warn',
        },
      })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) {
          event.source.checked = previousValue;
          return;
        }

        const success = await this.usersStore.updateStatus(user.id, newValue);

        if (!success) {
          event.source.checked = previousValue;
          return;
        }

        this.notificationService.success(
          newValue
            ? `Usuário ${user.name} ativado com sucesso`
            : `Usuário ${user.name} desativado com sucesso`,
        );
      });
  }

  isMasterUser(user: UserDto): boolean {
    const me = this.authStore.me();
    if (!me) return false;

    // regra atual: usuário logado (email único)
    return user.email === me.email;
  }

  openResetPasswordDialog(user: UserDto): void {
    this.usersStore.clearResetPasswordError();

    this.matDialog.open(ResetPasswordDialogComponent, {
      width: '640px',
      maxWidth: '92vw',
      autoFocus: false,
      data: { user },
    });
  }
}

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

import { UsersStore } from '../../data/users.store';
import { UserFormDialogComponent } from '../../components/user-form-dialog/user-form-dialog.component';
import { UserAvatarComponent } from '../../../../../shared/ui/user-avatar/user-avatar.component';
import { UserDto } from '../../models/user.models';
import { AuthStore } from '../../../../../core/auth/auth.store';
import { ConfirmDialogComponent } from '../../../../../shared/ui/confirm-dialog/confirm-dialog.component';

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
  ],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.scss'],
})
export class UsersPageComponent {
  usersStore = inject(UsersStore);
  matDialog = inject(MatDialog);
  authStore = inject(AuthStore);

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

  onToggleStatus(user: UserDto, isActive: boolean): void {
    const previousValue = user.isActive;

    this.matDialog
      .open(ConfirmDialogComponent, {
        data: {
          title: isActive ? 'Ativar usuário' : 'Desativar usuário',
          message: `Deseja ${isActive ? 'ativar' : 'desativar'} ${user.name}?`,
        },
      })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) {
          // 🔄 reverte visualmente
          this.usersStore.users.update((users) =>
            users.map((u) =>
              u.id === user.id ? { ...u, isActive: previousValue } : u,
            ),
          );
          return;
        }

        await this.usersStore.updateStatus(user.id, isActive);
      });
  }

  isMasterUser(user: UserDto): boolean {
    const me = this.authStore.me();
    if (!me) return false;

    // regra atual: usuário logado (email único)
    return user.email === me.email;
  }
}

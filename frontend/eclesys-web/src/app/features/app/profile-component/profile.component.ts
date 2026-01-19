import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthStore } from '../../../core/auth/auth.store';
import { UsersService } from '../../../core/auth/users.service';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    FormsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  authStore = inject(AuthStore);
  private usersService = inject(UsersService);
  private snackBar = inject(MatSnackBar);

  isCurrentPasswordVisible = signal(false);
isNewPasswordVisible = signal(false);
isConfirmPasswordVisible = signal(false);

toggleCurrentPasswordVisibility() {
  this.isCurrentPasswordVisible.set(!this.isCurrentPasswordVisible());
}

toggleNewPasswordVisibility() {
  this.isNewPasswordVisible.set(!this.isNewPasswordVisible());
}

toggleConfirmPasswordVisibility() {
  this.isConfirmPasswordVisible.set(!this.isConfirmPasswordVisible());
}


  // ====== signals do form de senha ======
  currentPassword = signal('');
  newPassword = signal('');
  confirmNewPassword = signal('');

  isChangingPasswordSignal = signal(false);
  passwordErrorMessageSignal = signal<string | null>(null);

  canChangePassword = computed(() => {
    if (this.isChangingPasswordSignal()) return false;
    if (this.currentPassword().trim().length === 0) return false;
    if (this.newPassword().trim().length < 8) return false;
    if (this.newPassword() !== this.confirmNewPassword()) return false;
    return true;
  });

  changePassword() {
    if (!this.canChangePassword()) return;

    let me = this.authStore.me();
    if (!me?.userId) {
      this.passwordErrorMessageSignal.set('Não foi possível identificar o usuário logado.');
      return;
    }

    this.isChangingPasswordSignal.set(true);
    this.passwordErrorMessageSignal.set(null);

    this.usersService
      .changePassword(me.userId, {
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
      })
      .subscribe({
        next: () => {
          this.isChangingPasswordSignal.set(false);

          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmNewPassword.set('');

          this.snackBar.open('Senha alterada com sucesso.', 'OK', { duration: 2500 });
        },
        error: (error) => {
          let message = error?.error?.message ?? 'Não foi possível alterar a senha.';
          this.passwordErrorMessageSignal.set(message);
          this.isChangingPasswordSignal.set(false);
        },
      });
  }
}

import { Component, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';

import { AuthStore } from '../../../../../core/auth/auth.store';
import { UsersService } from '../../../../../core/auth/users.service';
import { TenantLogosService } from '../../../../../shared/api/tenant-logos.service';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserAvatarComponent } from '../../../../../shared/ui/user-avatar/user-avatar.component';
import { ErrorStateMatcher } from '@angular/material/core';

@Component({
  standalone: true,
  selector: 'app-profile',
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
    UserAvatarComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  authStore = inject(AuthStore);
  private usersService = inject(UsersService);
  private tenantLogosService = inject(TenantLogosService);
  private snackBar = inject(MatSnackBar);

  isEditingProfileSignal = signal(false);
  isSavingProfileSignal = signal(false);

  profileName = signal('');
  profileErrorMessageSignal = signal<string | null>(null);

  isCurrentPasswordVisible = signal(false);
  isNewPasswordVisible = signal(false);
  isConfirmPasswordVisible = signal(false);

  currentPassword = signal('');
  newPassword = signal('');
  confirmNewPassword = signal('');

  isChangingPasswordSignal = signal(false);
  passwordErrorMessageSignal = signal<string | null>(null);
  logoErrorMessageSignal = signal<string | null>(null);
  logoFile = signal<File | null>(null);
  logoPreviewUrl = signal<string | null>(null);
  isUploadingLogoSignal = signal(false);

  private currentLogoObjectUrl: string | null = null;

  meNameSignal = computed(() => this.authStore.me()?.name ?? null);
  meEmailSignal = computed(() => this.authStore.me()?.email ?? null);
  isAdminSignal = computed(() => this.authStore.me()?.role === 'ADMIN');

  canUploadLogo = computed(() => {
    if (this.isUploadingLogoSignal()) return false;
    return !!this.logoFile();
  });

  @ViewChild('logoInput') logoInput?: ElementRef<HTMLInputElement>;

  isProfileDirty = computed(() => {
    const me = this.authStore.me();
    if (!me) return false;

    return this.profileName().trim() !== String(me.name ?? '').trim();
  });

  canSaveProfile = computed(() => {
    if (this.isSavingProfileSignal()) return false;
    if (!this.isEditingProfileSignal()) return false;
    if (!this.isProfileDirty()) return false;
    if (this.profileName().trim().length < 3) return false;

    return true;
  });

  canChangePassword = computed(() => {
    if (this.isChangingPasswordSignal()) return false;
    if (this.currentPassword().trim().length === 0) return false;
    if (this.newPassword().trim().length < 8) return false;
    if (this.confirmNewPassword().trim().length < 8) return false;
    if (this.isNewPasswordMismatch()) return false;

    return true;
  });

  startEditProfile() {
    const me = this.authStore.me();
    if (!me) return;

    this.profileErrorMessageSignal.set(null);
    this.profileName.set(me.name ?? '');
    this.isEditingProfileSignal.set(true);
  }

  cancelEditProfile() {
    this.profileErrorMessageSignal.set(null);
    this.profileName.set('');
    this.isEditingProfileSignal.set(false);
  }

  saveProfile() {
    if (!this.canSaveProfile()) return;

    this.usersService.updateMyName({
      name: this.profileName().trim(),
    });

    this.isSavingProfileSignal.set(true);
    this.profileErrorMessageSignal.set(null);

    this.usersService
      .updateMyName({
        name: this.profileName().trim(),
      })

      .subscribe({
        next: (updatedUser) => {
          this.isSavingProfileSignal.set(false);
          this.isEditingProfileSignal.set(false);
          this.profileName.set('');

          if (this.authStore.updateMe) {
            this.authStore.updateMe(updatedUser);
          } else if (this.authStore.loadMe) {
            this.authStore.loadMe();
          }

          this.snackBar.open('Nome atualizado com sucesso.', 'OK', {
            duration: 2500,
          });
        },
        error: (error) => {
          const message =
            error?.error?.message ?? 'Não foi possível atualizar o nome.';
          this.profileErrorMessageSignal.set(message);
          this.isSavingProfileSignal.set(false);
        },
      });
  }

  toggleCurrentPasswordVisibility() {
    this.isCurrentPasswordVisible.set(!this.isCurrentPasswordVisible());
  }

  toggleNewPasswordVisibility() {
    this.isNewPasswordVisible.set(!this.isNewPasswordVisible());
  }

  toggleConfirmPasswordVisibility() {
    this.isConfirmPasswordVisible.set(!this.isConfirmPasswordVisible());
  }

  changePassword() {
    if (this.isChangingPasswordSignal()) return;
    if (!this.canChangePassword()) return;

    const me = this.authStore.me();
    if (!me?.userId) {
      this.passwordErrorMessageSignal.set(
        'Não foi possível identificar o usuário logado.',
      );
      return;
    }

    const currentPasswordValue = this.currentPassword().trim();
    const newPasswordValue = this.newPassword().trim();

    if (currentPasswordValue.length === 0) {
      this.passwordErrorMessageSignal.set('Informe a senha atual.');
      return;
    }

    if (newPasswordValue.length < 8) {
      this.passwordErrorMessageSignal.set(
        'A nova senha deve ter no mínimo 8 caracteres.',
      );
      return;
    }

    if (this.isNewPasswordMismatch()) {
      this.passwordErrorMessageSignal.set('As senhas não conferem.');
      return;
    }

    this.isChangingPasswordSignal.set(true);
    this.passwordErrorMessageSignal.set(null);

    this.usersService
      .changePassword(me.userId, {
        currentPassword: currentPasswordValue,
        newPassword: newPasswordValue,
      })
      .subscribe({
        next: () => {
          this.isChangingPasswordSignal.set(false);

          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmNewPassword.set('');

          this.snackBar.open('Senha alterada com sucesso.', 'OK', {
            duration: 2500,
          });
        },
        error: (error) => {
          const message =
            error?.error?.message ?? 'Não foi possível alterar a senha.';
          this.passwordErrorMessageSignal.set(message);
          this.isChangingPasswordSignal.set(false);
        },
      });
  }

  isNewPasswordMismatch = computed(() => {
    const newPasswordValue = this.newPassword().trim();
    const confirmPasswordValue = this.confirmNewPassword().trim();

    if (newPasswordValue.length === 0 || confirmPasswordValue.length === 0) {
      return false;
    }

    if (newPasswordValue.length < 8 || confirmPasswordValue.length < 8) {
      return false;
    }

    return newPasswordValue !== confirmPasswordValue;
  });

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.logoErrorMessageSignal.set(null);

    if (!file) {
      this.logoFile.set(null);
      this.clearLogoPreview();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.logoErrorMessageSignal.set('Selecione um arquivo de imagem válido.');
      this.logoFile.set(null);
      this.clearLogoPreview();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.logoErrorMessageSignal.set('O logo deve ter no máximo 5MB.');
      this.logoFile.set(null);
      this.clearLogoPreview();
      return;
    }

    this.logoFile.set(file);
    this.setLogoPreview(file);
  }

  uploadLogo() {
    const file = this.logoFile();
    if (!file || this.isUploadingLogoSignal()) return;

    this.isUploadingLogoSignal.set(true);
    this.logoErrorMessageSignal.set(null);

    this.tenantLogosService.uploadLogo(file).subscribe({
      next: (response) => {
        this.isUploadingLogoSignal.set(false);
        this.logoFile.set(null);
        this.clearLogoPreview();

        const logoUrl = response.data?.logoUrl ?? null;
        this.authStore.updateMe({ tenantLogoUrl: logoUrl ?? undefined });

        if (this.logoInput?.nativeElement) {
          this.logoInput.nativeElement.value = '';
        }

        this.snackBar.open('Logo atualizado com sucesso.', 'OK', {
          duration: 2500,
        });
      },
      error: (error) => {
        const message =
          error?.error?.message ?? 'Não foi possível atualizar o logo.';
        this.logoErrorMessageSignal.set(message);
        this.isUploadingLogoSignal.set(false);
      },
    });
  }

  removeLogo() {
    if (this.isUploadingLogoSignal()) return;

    this.isUploadingLogoSignal.set(true);
    this.logoErrorMessageSignal.set(null);

    this.tenantLogosService.removeLogo().subscribe({
      next: () => {
        this.isUploadingLogoSignal.set(false);
        this.logoFile.set(null);
        this.clearLogoPreview();
        this.authStore.updateMe({ tenantLogoUrl: undefined });

        if (this.logoInput?.nativeElement) {
          this.logoInput.nativeElement.value = '';
        }

        this.snackBar.open('Logo removido com sucesso.', 'OK', {
          duration: 2500,
        });
      },
      error: (error) => {
        const message =
          error?.error?.message ?? 'Não foi possível remover o logo.';
        this.logoErrorMessageSignal.set(message);
        this.isUploadingLogoSignal.set(false);
      },
    });
  }

  private setLogoPreview(file: File) {
    this.clearLogoPreview();
    this.currentLogoObjectUrl = URL.createObjectURL(file);
    this.logoPreviewUrl.set(this.currentLogoObjectUrl);
  }

  private clearLogoPreview() {
    if (this.currentLogoObjectUrl) {
      URL.revokeObjectURL(this.currentLogoObjectUrl);
    }
    this.currentLogoObjectUrl = null;
    this.logoPreviewUrl.set(null);
  }

  confirmPasswordErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null) => {
      if (!control) return false;

      const shouldShowError = control.dirty || control.touched;
      return shouldShowError && this.isNewPasswordMismatch();
    },
  };
}

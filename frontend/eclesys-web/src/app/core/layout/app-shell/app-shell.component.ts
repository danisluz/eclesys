import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AuthStore } from '../../auth/auth.store';
import { UserAvatarComponent } from '../../../shared/ui/user-avatar/user-avatar.component';
import { AppConfirmService } from '../../services/app-confirm.service';
import { AppNotificationCenterComponent } from '../../../shared/ui/app-notification-center/app-notification-center.component';

@Component({
  standalone: true,
  selector: 'app-app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, UserAvatarComponent, AppNotificationCenterComponent, Dialog, ButtonModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  authStore = inject(AuthStore);
  readonly confirmService = inject(AppConfirmService);
  readonly confirmDialogStyle = { width: '28rem' };

  userMenuOpen = signal(false);

  meNameSignal = computed(() => this.authStore.me()?.name ?? null);
  meEmailSignal = computed(() => this.authStore.me()?.email ?? null);
  tenantLogoUrl = computed(() => this.authStore.me()?.tenantLogoUrl ?? null);
  tenantName = computed(() => this.authStore.me()?.tenantName ?? '');

  userInitials = computed(() => {
    const name = this.authStore.me()?.name ?? 'U';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join('');
  });

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
  }

  @HostListener('document:click')
  closeUserMenu() {
    this.userMenuOpen.set(false);
  }
}

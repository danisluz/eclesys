import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthStore } from '../../auth/auth.store';
import { UserAvatarComponent } from '../../../shared/ui/user-avatar/user-avatar.component';

@Component({
  standalone: true,
  selector: 'app-app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, UserAvatarComponent, Toast, ConfirmDialogModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  authStore = inject(AuthStore);

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

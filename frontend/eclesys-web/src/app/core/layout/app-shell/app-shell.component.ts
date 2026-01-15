import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../auth/auth.store';

@Component({
  standalone: true,
  selector: 'app-app-shell',
  imports: [
    RouterLink,
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  authStore = inject(AuthStore);

  currentYear = new Date().getFullYear();

  userInitials = computed(() => {
    const name = this.authStore.me()?.name ?? 'Usuário';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(part => part[0]?.toUpperCase()).join('');
  });
}

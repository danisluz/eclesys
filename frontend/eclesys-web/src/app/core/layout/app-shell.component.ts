import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

@Component({
  standalone: true,
  selector: 'app-app-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="brand">ECLESYS</div>

        <nav class="menu">
          <a routerLink="/app/dashboard" routerLinkActive="active">Dashboard</a>
          <a class="disabled">Membros (em breve)</a>
          <a class="disabled">Famílias (em breve)</a>
          <a class="disabled">Eventos (em breve)</a>
        </nav>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="user">
            <div class="name">{{ authStore.userName() || 'Usuário' }}</div>
            <div class="role">{{ authStore.userRole() || '' }}</div>
          </div>
          <button class="btn" (click)="authStore.logout()">Sair</button>
        </header>

        <section class="content">
          <router-outlet />
        </section>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
    .sidebar { border-right: 1px solid #e5e5e5; padding: 18px; }
    .brand { font-weight: 800; margin-bottom: 18px; }
    .menu { display: flex; flex-direction: column; gap: 10px; }
    .menu a { text-decoration: none; color: #222; padding: 10px 12px; border-radius: 10px; }
    .menu a.active { border: 1px solid #222; }
    .menu a.disabled { color: #999; cursor: not-allowed; }
    .main { display: flex; flex-direction: column; }
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #e5e5e5; }
    .user .name { font-weight: 700; }
    .user .role { font-size: 12px; color: #777; }
    .content { padding: 18px; }
    .btn { padding: 8px 12px; border: 1px solid #222; border-radius: 10px; background: white; cursor: pointer; }
  `],
})
export class AppShellComponent {
  authStore = inject(AuthStore);
}

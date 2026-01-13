import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h2>Entrar</h2>
    <p class="muted">Acesse o painel de gestão da sua igreja.</p>

    <div class="card">
      <div class="row">
        <label>Tenant code</label>
        <input [(ngModel)]="tenantCode" placeholder="igreja-teste-central" />
      </div>

      <div class="row">
        <label>E-mail</label>
        <input [(ngModel)]="email" placeholder="admin@igreja.com" />
      </div>

      <div class="row">
        <label>Senha</label>
        <input [(ngModel)]="password" type="password" placeholder="••••••" />
      </div>

      <button class="btn primary" (click)="login()">Entrar</button>

      <p class="muted">
        Não tem acesso? <a routerLink="/signup">Assinar</a>
      </p>
    </div>
  `,
  styles: [`
    .muted { color: #666; }
    .card { border: 1px solid #e5e5e5; border-radius: 14px; padding: 14px; max-width: 420px; }
    .row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 12px; }
    .btn { padding: 10px 14px; border-radius: 12px; border: 1px solid #111; background: #111; color: #fff; cursor: pointer; width: 100%; }
  `],
})
export class LoginComponent {
  authStore = inject(AuthStore);

  tenantCode = '';
  email = '';
  password = '';

  login() {
    this.authStore.login({
      tenantCode: this.tenantCode.trim(),
      email: this.email.trim(),
      password: this.password,
    });
  }
}

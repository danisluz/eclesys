import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  standalone: true,
  template: `
    <h2>Dashboard</h2>
    <p class="muted">Bem-vindo, {{ authStore.userName() || 'usuário' }}.</p>

    <div class="grid">
      <div class="card">
        <h3>Membros</h3>
        <p>Em breve: listagem e cadastro.</p>
      </div>
      <div class="card">
        <h3>Eventos</h3>
        <p>Em breve: calendário e cultos.</p>
      </div>
      <div class="card">
        <h3>Usuários</h3>
        <p>Administração via backend já pronta.</p>
      </div>
    </div>
  `,
  styles: [`
    .muted { color: #666; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 14px; }
    .card { border: 1px solid #e5e5e5; border-radius: 14px; padding: 14px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `],
})
export class DashboardComponent {
  authStore = inject(AuthStore);
}

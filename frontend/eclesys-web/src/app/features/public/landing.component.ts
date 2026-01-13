import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <h1>Gestão completa para sua igreja</h1>
      <p>Cadastre membros, organize famílias, controle eventos e permissões — tudo num só lugar.</p>

      <div class="actions">
        <a class="primary" routerLink="/signup">Assinar um plano</a>
        <a class="secondary" routerLink="/login">Entrar</a>
      </div>
    </section>

    <section class="grid">
      <div class="card">
        <h3>Membros</h3>
        <p>Cadastro organizado e pronto para crescer.</p>
      </div>
      <div class="card">
        <h3>Famílias</h3>
        <p>Vínculos e histórico bem estruturados.</p>
      </div>
      <div class="card">
        <h3>Eventos</h3>
        <p>Planejamento e registros em um fluxo simples.</p>
      </div>
      <div class="card">
        <h3>Permissões</h3>
        <p>ADMIN, SECRETARIA, LIDER com segurança.</p>
      </div>
    </section>
  `,
  styles: [`
    .hero { padding: 24px 0 12px; }
    h1 { font-size: 40px; line-height: 1.1; margin: 0 0 10px; }
    p { color: #555; margin: 0 0 18px; font-size: 16px; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .primary, .secondary { text-decoration: none; padding: 10px 14px; border-radius: 12px; display: inline-block; }
    .primary { background: #111; color: #fff; }
    .secondary { border: 1px solid #111; color: #111; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 24px; }
    .card { border: 1px solid #e5e5e5; border-radius: 14px; padding: 14px; }
    .card h3 { margin: 0 0 6px; }
    .card p { margin: 0; color: #666; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
  `],
})
export class LandingComponent {}

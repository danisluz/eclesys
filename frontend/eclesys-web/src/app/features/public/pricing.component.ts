import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <h2>Planos</h2>
    <p class="muted">Escolha um plano para começar (sem pagamento por enquanto).</p>

    <div class="plans">
      <div class="plan">
        <h3>Básico</h3>
        <div class="price">R$ 29/mês</div>
        <ul>
          <li>Membros</li>
          <li>Famílias</li>
          <li>Eventos</li>
        </ul>
        <a class="btn" routerLink="/signup" [queryParams]="{ plan: 'BASICO' }">Assinar</a>
      </div>

      <div class="plan highlight">
        <h3>Pro</h3>
        <div class="price">R$ 59/mês</div>
        <ul>
          <li>Tudo do Básico</li>
          <li>Permissões avançadas</li>
          <li>Relatórios</li>
        </ul>
        <a class="btn primary" routerLink="/signup" [queryParams]="{ plan: 'PRO' }">Assinar</a>
      </div>
    </div>
  `,
  styles: [`
    .muted { color: #666; margin-top: 6px; }
    .plans { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
    .plan { border: 1px solid #e5e5e5; border-radius: 14px; padding: 14px; }
    .highlight { border-color: #111; }
    .price { font-size: 22px; font-weight: 800; margin: 10px 0; }
    ul { margin: 0 0 14px; padding-left: 18px; color: #444; }
    .btn { display: inline-block; text-decoration: none; padding: 10px 14px; border-radius: 12px; border: 1px solid #111; color: #111; }
    .primary { background: #111; color: #fff; }
    @media (max-width: 700px) { .plans { grid-template-columns: 1fr; } }
  `],
})
export class PricingComponent {}

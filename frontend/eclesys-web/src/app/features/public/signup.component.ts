import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <h2>Assinar ECLESYS</h2>
    <p class="muted">Preencha para solicitar seu acesso. (Pagamento entra depois.)</p>

    <div class="card">
      <div class="row">
        <label>Plano</label>
        <input [value]="plan()" disabled />
      </div>

      <div class="row">
        <label>Nome da Igreja</label>
        <input [(ngModel)]="churchName" placeholder="Igreja Exemplo" />
      </div>

      <div class="row">
        <label>Seu nome</label>
        <input [(ngModel)]="adminName" placeholder="Responsável" />
      </div>

      <div class="row">
        <label>E-mail</label>
        <input [(ngModel)]="email" placeholder="email@igreja.com" />
      </div>

      <div class="row">
        <label>Tenant code (slug)</label>
        <input [(ngModel)]="tenantCode" placeholder="igreja-exemplo" />
        <small>Dica: letras minúsculas e hífen.</small>
      </div>

      <button class="btn primary" (click)="submit()">Solicitar acesso</button>

      <p class="ok" *ngIf="submitted()">Recebemos sua solicitação! Em breve você poderá acessar.</p>

      <p class="muted">
        Já tem acesso? <a routerLink="/login">Entrar</a>
      </p>
    </div>
  `,
  styles: [`
    .muted { color: #666; }
    .card { border: 1px solid #e5e5e5; border-radius: 14px; padding: 14px; max-width: 520px; }
    .row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 12px; }
    small { color: #777; }
    .btn { padding: 10px 14px; border-radius: 12px; border: 1px solid #111; background: #111; color: #fff; cursor: pointer; }
    .ok { margin-top: 12px; color: #0a7; font-weight: 600; }
  `],
})
export class SignupComponent {
  plan = signal('PRO');

  churchName = '';
  adminName = '';
  email = '';
  tenantCode = '';

  submitted = signal(false);

  constructor(route: ActivatedRoute) {
    let queryPlan = route.snapshot.queryParamMap.get('plan');
    if (queryPlan) this.plan.set(queryPlan);
  }

  submit() {
    // MVP: sem backend ainda. Depois vira POST /api/public/signup.
    this.submitted.set(true);
  }
}

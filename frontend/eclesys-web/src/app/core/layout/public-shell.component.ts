import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-public-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="public-header">
      <div class="container header-row">
        <div class="logo">ECLESYS</div>

        <nav class="nav">
          <a routerLink="/">Produto</a>
          <a routerLink="/pricing">Planos</a>
          <a routerLink="/signup">Assinar</a>
          <a class="btn" routerLink="/login">Entrar</a>
        </nav>
      </div>
    </header>

    <main class="container public-content">
      <router-outlet />
    </main>

    <footer class="public-footer">
      <div class="container">© {{ year }} ECLESYS</div>
    </footer>
  `,
  styles: [`
    .container { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
    .public-header { border-bottom: 1px solid #e5e5e5; padding: 14px 0; position: sticky; top: 0; background: white; }
    .header-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .logo { font-weight: 800; letter-spacing: 0.5px; }
    .nav { display: flex; align-items: center; gap: 14px; }
    .nav a { text-decoration: none; color: #222; }
    .btn { padding: 8px 12px; border: 1px solid #222; border-radius: 10px; }
    .public-content { padding: 28px 16px; }
    .public-footer { border-top: 1px solid #e5e5e5; padding: 16px 0; color: #666; }
  `],
})
export class PublicShellComponent {
  year = new Date().getFullYear();
}

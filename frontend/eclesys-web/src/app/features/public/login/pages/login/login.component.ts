import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../../../../core/auth/auth.store';
import { environment } from '../../../../../../environments/environment';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  authStore = inject(AuthStore);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('turnstileContainer')
  turnstileContainer!: ElementRef<HTMLDivElement>;

  platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  turnstileToken = signal<string | null>(null);
  turnstileSiteKey = environment.turnstileSiteKey;

  tenantCode = '';
  email = '';
  password = '';

  wasSubmitted = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    if (!this.isBrowser) return;

    afterNextRender(() => {
      // Aguarda o script do Turnstile carregar
      const initTurnstile = () => {
        const turnstile = (window as any).turnstile;

        if (!turnstile) {
          console.warn('Turnstile ainda não carregou, tentando novamente...');
          setTimeout(initTurnstile, 500);
          return;
        }

        if (!this.turnstileContainer?.nativeElement) {
          console.error('Container do Turnstile não encontrado');
          this.errorMessage.set('Erro ao carregar verificação anti-bot.');
          return;
        }

        try {
          turnstile.render(this.turnstileContainer.nativeElement, {
            sitekey: this.turnstileSiteKey,
            theme: 'light',
            callback: (token: string) => this.turnstileToken.set(token),
            'expired-callback': () => this.turnstileToken.set(null),
            'error-callback': () => {
              this.turnstileToken.set(null);
              this.errorMessage.set(
                'Falha na verificação anti-bot. Tente novamente.',
              );
            },
          });
          console.log('Turnstile renderizado com sucesso');
        } catch (error) {
          console.error('Erro ao renderizar Turnstile:', error);
          this.errorMessage.set('Erro ao carregar verificação anti-bot.');
        }
      };

      // Inicia após pequeno delay
      setTimeout(initTurnstile, 300);
    });
  }

  submit(form: NgForm) {
    this.wasSubmitted.set(true);
    this.errorMessage.set(null);

    if (form.invalid) {
      Object.values(form.controls).forEach((control) =>
        control.markAsTouched(),
      );
      this.snackBar.open('Preencha todos os campos obrigatórios.', 'OK', {
        duration: 4000,
      });
      return;
    }

    const token = this.turnstileToken();

    if (!token) {
      this.errorMessage.set('Confirme a verificação anti-bot para continuar.');
      this.snackBar.open(
        'Confirme a verificação anti-bot para continuar.',
        'OK',
        {
          duration: 4000,
        },
      );
      return;
    }

    this.authStore.login({
      tenantCode: this.tenantCode.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      antiBotToken: token,
    });
  }
}

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
import { AuthStore } from '../../../core/auth/auth.store';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  authStore = inject(AuthStore);

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
      const turnstile = (window as any).turnstile;

      if (!turnstile || !this.turnstileContainer?.nativeElement) {
        this.errorMessage.set(
          'Turnstile não carregou. Confere o script no index.html.'
        );
        return;
      }

      turnstile.render(this.turnstileContainer.nativeElement, {
        sitekey: this.turnstileSiteKey,
        theme: 'light',
        callback: (token: string) => this.turnstileToken.set(token),
        'expired-callback': () => this.turnstileToken.set(null),
        'error-callback': () => {
          this.turnstileToken.set(null);
          this.errorMessage.set('Falha na verificação anti-bot. Tente novamente.');
        },
      });
    });
  }

  submit(form: NgForm) {
    this.wasSubmitted.set(true);
    this.errorMessage.set(null);

    if (form.invalid) {
      Object.values(form.controls).forEach((control) => control.markAsTouched());
      return;
    }

    const token = this.turnstileToken();

    if (!token) {
      this.errorMessage.set('Confirme a verificação anti-bot para continuar.');
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

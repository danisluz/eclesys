import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  inject,
  signal,
  afterNextRender,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SignupService } from './signup.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  @ViewChild('turnstileContainer')
  turnstileContainer!: ElementRef<HTMLDivElement>;

  turnstileToken = signal<string | null>(null);
  turnstileSiteKey = environment.turnstileSiteKey;

  private signupService = inject(SignupService);

  platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  plan = signal('PRO');

  churchName = '';
  adminName = '';
  email = '';
  tenantCode = '';
  adminPassword = '';

  isLoading = signal(false);
  isSuccess = signal(false);
  errorMessage = signal<string | null>(null);

  wasSubmitted = signal(false);

  constructor(route: ActivatedRoute) {
    const queryPlan = route.snapshot.queryParamMap.get('plan');
    if (queryPlan) this.plan.set(queryPlan);

    if (!this.isBrowser) {
      return;
    }

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
          this.errorMessage.set(
            'Falha na verificação anti-bot. Tente novamente.'
          );
        },
      });
    });
  }

  normalizeTenantCode(value: string) {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    this.tenantCode = normalized;
  }

  submit(form: NgForm) {
    this.wasSubmitted.set(true);
    this.errorMessage.set(null);
    this.isSuccess.set(false);

    if (form.invalid) {
      Object.values(form.controls).forEach((control) =>
        control.markAsTouched()
      );
      return;
    }

    this.isLoading.set(true);

    if (!this.turnstileToken()) {
      this.errorMessage.set('Confirme a verificação anti-bot para continuar.');
      return;
    }

    this.signupService
      .create({
        tenantCode: this.tenantCode,
        churchName: this.churchName.trim(),
        adminName: this.adminName.trim(),
        adminEmail: this.email.trim().toLowerCase(),
        adminPassword: this.adminPassword,
        antiBotToken: this.turnstileToken(),
        logoUrl: null,
      })
      .subscribe({
        next: () => {
          this.isSuccess.set(true);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || 'Erro ao solicitar acesso'
          );
          this.isLoading.set(false);
        },
      });
  }
}

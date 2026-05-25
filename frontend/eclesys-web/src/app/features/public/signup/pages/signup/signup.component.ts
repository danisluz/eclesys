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
import { SignupService } from '../../services/signup.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  readonly year = new Date().getFullYear();

  @ViewChild('turnstileContainer')
  turnstileContainer!: ElementRef<HTMLDivElement>;

  turnstileToken = signal<string | null>(null);
  turnstileSiteKey = environment.turnstileSiteKey;

  private readonly signupService = inject(SignupService);

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
      const turnstile = (globalThis as any).turnstile;

      if (!turnstile || !this.turnstileContainer?.nativeElement) {
        this.errorMessage.set(
          'Turnstile não carregou. Confere o script no index.html.',
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
            'Falha na verificação anti-bot. Tente novamente.',
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

    console.log('[Signup] Form valid:', form.valid);
    console.log(
      '[Signup] Turnstile token:',
      this.turnstileToken() ? 'EXISTS' : 'NULL',
    );

    if (form.invalid) {
      Object.values(form.controls).forEach((control) =>
        control.markAsTouched(),
      );
      return;
    }

    if (!this.turnstileToken()) {
      this.errorMessage.set('Confirme a verificação anti-bot para continuar.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    const payload = {
      tenantCode: this.tenantCode,
      churchName: this.churchName.trim(),
      adminName: this.adminName.trim(),
      adminEmail: this.email.trim().toLowerCase(),
      adminPassword: this.adminPassword,
      antiBotToken: this.turnstileToken(),
      logoUrl: null,
    };

    console.log(
      '[Signup] Sending payload with token:',
      payload.antiBotToken ? 'EXISTS' : 'NULL',
    );

    this.signupService.create(payload).subscribe({
      next: () => {
        this.isSuccess.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[Signup] Error:', err);
        this.errorMessage.set(
          err?.error?.message || 'Erro ao solicitar acesso',
        );
        this.isLoading.set(false);
      },
    });
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenStorage } from './token.storage';
import { AuthUser, LoginRequest } from './models';
import { MeService } from './me.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private router = inject(Router);
  private authService = inject(AuthService);
  private meService = inject(MeService);
  private tokenStorage = inject(TokenStorage);

  private tokenSignal = signal<string | null>(this.tokenStorage.getToken());
  private meSignal = signal<AuthUser | null>(this.tokenStorage.getUser<AuthUser>());
  private isMeLoadingSignal = signal(false);

  isAuthenticated = computed(() => !!this.tokenSignal());
  isMeLoading = computed(() => this.isMeLoadingSignal());

  me = computed(() => this.meSignal());

  userName = computed(() => this.meSignal()?.name ?? null);
  userRole = computed(() => this.meSignal()?.role ?? null);
  tenantName = computed(() => this.meSignal()?.tenantName ?? null);
  tenantCode = computed(() => this.meSignal()?.tenantCode ?? null);

  token() {
    return this.tokenSignal();
  }

  loadMe() {
    if (!this.tokenSignal() || this.isMeLoadingSignal() || this.meSignal()) return;

    this.isMeLoadingSignal.set(true);

    this.meService.getMe().subscribe({
      next: (response: any) => {
        this.meSignal.set(response.data);
        this.tokenStorage.setUser(response.data);
        this.isMeLoadingSignal.set(false);
      },
      error: () => {
        this.isMeLoadingSignal.set(false);
        this.logout();
      },
    });
  }

  login(request: LoginRequest) {
    return this.authService.login(request).subscribe({
      next: (response) => {
        let token = response.data.token;

        this.tokenStorage.setToken(token);
        this.tokenSignal.set(token);

        this.meSignal.set(null);
        this.tokenStorage.setUser(null);
        this.loadMe();

        this.router.navigateByUrl('/app');
      },
      error: () => {
        alert('Falha no login. Verifique tenant, e-mail e senha.');
      },
    });
  }

  logout() {
    this.tokenStorage.clearAll();
    this.tokenSignal.set(null);
    this.meSignal.set(null);
    this.router.navigateByUrl('/login');
  }
}

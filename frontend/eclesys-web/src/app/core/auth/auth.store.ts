import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenStorage } from './token.storage';
import { AuthUser, LoginRequest } from './models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private router = inject(Router);
  private authService = inject(AuthService);
  private tokenStorage = inject(TokenStorage);

  private tokenSignal = signal<string | null>(this.tokenStorage.getToken());
  private userSignal = signal<AuthUser | null>(this.tokenStorage.getUser<AuthUser>());

  isAuthenticated = computed(() => !!this.tokenSignal());

  userName = computed(() => this.userSignal()?.name ?? null);
  userRole = computed(() => this.userSignal()?.role ?? null);

  private tenantNameSignal = signal<string | null>(null);

  tenantName = computed(() => this.tenantNameSignal());

  setTenantName(tenantName: string | null) {
    this.tenantNameSignal.set(tenantName);
  }

  token() {
    return this.tokenSignal();
  }

  login(request: LoginRequest) {
    return this.authService.login(request).subscribe({
      next: (response) => {
        let token = response.data.token;

        this.tokenStorage.setToken(token);
        this.tokenSignal.set(token);

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
    this.userSignal.set(null);
    this.router.navigateByUrl('/login');
  }
}

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
  private meSignal = signal<AuthUser | null>(
    this.tokenStorage.getUser<AuthUser>(),
  );
  private isMeLoadingSignal = signal(false);

  constructor() {
    const storedToken = this.tokenStorage.getToken();
    console.log(
      '[AuthStore] Constructor - Token from storage:',
      storedToken ? 'EXISTS' : 'NULL',
    );
    console.log('[AuthStore] Token length:', storedToken?.length);
  }

  isAuthenticated = computed(() => !!this.tokenSignal());
  isMeLoading = computed(() => this.isMeLoadingSignal());

  me = computed(() => this.meSignal());

  userName = computed(() => this.meSignal()?.name ?? null);
  userRole = computed(() => this.meSignal()?.role ?? null);
  tenantName = computed(() => this.meSignal()?.tenantName ?? null);
  tenantCode = computed(() => this.meSignal()?.tenantCode ?? null);

  token() {
    const currentToken = this.tokenSignal();
    console.log(
      '[AuthStore] token() called:',
      currentToken ? 'EXISTS' : 'NULL',
    );
    return currentToken;
  }

  loadMe() {
    if (!this.tokenSignal() || this.isMeLoadingSignal() || this.meSignal())
      return;

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

  async ensureMeLoaded(): Promise<boolean> {
    if (!this.isAuthenticated()) return false;
    if (this.me()) return true;

    try {
      await this.loadMe();
      return true;
    } catch {
      return false;
    }
  }

  updateMe(updatedUser: Partial<AuthUser>) {
    let currentUser = this.meSignal();

    if (!currentUser) {
      this.meSignal.set(updatedUser as AuthUser);
      this.tokenStorage.setUser(updatedUser);
      return;
    }

    let mergedUser = {
      ...currentUser,
      ...updatedUser,
    } as AuthUser;

    this.meSignal.set(mergedUser);
    this.tokenStorage.setUser(mergedUser);
  }

  login(request: LoginRequest) {
    return this.authService.login(request).subscribe({
      next: (response) => {
        let token = response.data.token;

        console.log('[AuthStore] Login successful, saving token');
        console.log('[AuthStore] Token length:', token?.length);

        this.tokenStorage.setToken(token);
        this.tokenSignal.set(token);

        // Verificar se foi salvo
        const savedToken = this.tokenStorage.getToken();
        console.log(
          '[AuthStore] Token saved to storage:',
          savedToken ? 'YES' : 'NO',
        );

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

  logoutWithMessage(message: string = 'Sessão expirada') {
    this.logout();
    // Opcional: exibir mensagem via snackbar se injetado
    console.warn('[AuthStore]', message);
  }
}

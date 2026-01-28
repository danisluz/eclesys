import {
  Injectable,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenStorage } from './token.storage';
import { AuthUser, LoginRequest } from './models';
import { MeService } from './me.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private router = inject(Router);
  private authService = inject(AuthService);
  private meService = inject(MeService);
  private tokenStorage = inject(TokenStorage);
  private platformId = inject(PLATFORM_ID);
  private notificationService = inject(NotificationService);

  private tokenSignal = signal<string | null>(null);
  private meSignal = signal<AuthUser | null>(null);
  private isMeLoadingSignal = signal(false);

  constructor() {
    // Carregar do storage apenas no browser (não no SSR)
    if (isPlatformBrowser(this.platformId)) {
      const storedToken = this.tokenStorage.getToken();
      const storedUser = this.tokenStorage.getUser<AuthUser>();

      console.log(
        '[AuthStore] Browser init - Token from storage:',
        storedToken ? 'EXISTS' : 'NULL',
      );
      console.log('[AuthStore] Token length:', storedToken?.length);

      if (storedToken) {
        this.tokenSignal.set(storedToken);
      }

      if (storedUser) {
        this.meSignal.set(storedUser);
      }
    } else {
      console.log('[AuthStore] Running on server, skipping storage load');
    }
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
    if (!this.tokenSignal() || this.isMeLoadingSignal()) return;

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
    if (!this.isAuthenticated()) {
      console.log('[AuthStore] Not authenticated');
      return false;
    }

    if (this.me()) {
      console.log('[AuthStore] Me already loaded');
      return true;
    }

    console.log('[AuthStore] Loading me from API...');

    return new Promise<boolean>((resolve) => {
      if (this.isMeLoadingSignal()) {
        // Já está carregando, aguardar
        const checkInterval = setInterval(() => {
          if (!this.isMeLoadingSignal()) {
            clearInterval(checkInterval);
            resolve(!!this.me());
          }
        }, 50);
        return;
      }

      this.isMeLoadingSignal.set(true);

      this.meService.getMe().subscribe({
        next: (response: any) => {
          console.log('[AuthStore] /me API success:', response);
          this.meSignal.set(response.data);
          this.tokenStorage.setUser(response.data);
          this.isMeLoadingSignal.set(false);
          resolve(true);
        },
        error: (err) => {
          console.error('[AuthStore] /me API error:', err);
          console.log(
            '[AuthStore] Token was:',
            this.tokenSignal()?.substring(0, 20) + '...',
          );
          this.isMeLoadingSignal.set(false);
          this.logout();
          resolve(false);
        },
      });
    });
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

  logoutWithMessage(
    message: string = 'Sessão expirada. Faça login novamente.',
  ) {
    console.warn('[AuthStore]', message);

    // Limpar estado
    this.tokenStorage.clearAll();
    this.tokenSignal.set(null);
    this.meSignal.set(null);

    // Mostrar mensagem apenas no browser
    if (isPlatformBrowser(this.platformId)) {
      this.notificationService.warn(message, 'Fechar', { duration: 5000 });
    }

    // Redirecionar
    this.router.navigateByUrl('/login');
  }
}

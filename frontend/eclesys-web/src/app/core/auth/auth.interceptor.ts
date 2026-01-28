import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError, of } from 'rxjs';
import { AuthStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const platformId = inject(PLATFORM_ID);
  const token = authStore.token();
  const isBrowser = isPlatformBrowser(platformId);

  // Se estamos no servidor e a requisição precisa de autenticação mas não tem token,
  // não fazer a requisição (evita erros 401 no SSR)
  if (!isBrowser && !token && !request.url.includes('/api/auth/login')) {
    console.log(
      '[authInterceptor] SSR: Skipping authenticated request:',
      request.url,
    );
    // Retorna um observable vazio para não bloquear o SSR
    return of({
      body: null,
      status: 200,
      statusText: 'SSR Skip',
      headers: request.headers,
      url: request.url,
      type: 4,
      ok: true,
      clone: () => ({}) as any,
    } as any);
  }

  console.log(
    '[authInterceptor]',
    isBrowser ? 'Browser' : 'Server',
    request.method,
    request.url,
    token ? 'HAS_TOKEN' : 'NO_TOKEN',
  );

  if (!token) return next(request);

  const clonedRequest = request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('[authInterceptor] Request failed:', {
        url: error.url,
        status: error.status,
        message: error.error?.message,
        error: error.error,
      });

      // Só faz logout se for erro 401 E a mensagem indicar token inválido/expirado
      // Mas NÃO faz logout se for erro de /api/me (já tratado no AuthStore)
      if (
        error.status === 401 &&
        error.error?.message?.toLowerCase().includes('token') &&
        !error.url?.includes('/api/me')
      ) {
        console.warn(
          '[authInterceptor] Token inválido ou expirado. Fazendo logout...',
        );
        authStore.logoutWithMessage('Sessão expirada. Faça login novamente.');
      }
      return throwError(() => error);
    }),
  );
};

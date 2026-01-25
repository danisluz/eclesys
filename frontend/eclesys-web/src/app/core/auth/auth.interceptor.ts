import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();

  console.log(
    '[authInterceptor]',
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
        authStore.logout();
      }
      return throwError(() => error);
    }),
  );
};

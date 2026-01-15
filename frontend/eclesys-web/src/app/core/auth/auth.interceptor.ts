import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();

  console.log('[authInterceptor]', request.method, request.url, token ? 'HAS_TOKEN' : 'NO_TOKEN');

  if (!token) return next(request);

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};

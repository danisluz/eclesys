import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const isAllowed = await authStore.ensureMeLoaded();
  if (!isAllowed) return router.parseUrl('/login');

  return true;
};

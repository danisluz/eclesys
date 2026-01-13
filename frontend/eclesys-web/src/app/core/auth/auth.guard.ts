import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
  let authStore = inject(AuthStore);
  let router = inject(Router);

  if (authStore.isAuthenticated()) return true;

  router.navigateByUrl('/login');
  return false;
};

import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // No SSR, sempre permitir (a verificação real acontece no browser)
  if (!isPlatformBrowser(platformId)) {
    console.log('[authGuard] Running on server, allowing...');
    return true;
  }

  console.log('[authGuard] Checking authentication...');
  console.log('[authGuard] isAuthenticated:', authStore.isAuthenticated());
  console.log('[authGuard] has me:', !!authStore.me());

  const isAllowed = await authStore.ensureMeLoaded();
  console.log('[authGuard] ensureMeLoaded result:', isAllowed);

  if (!isAllowed) {
    console.log('[authGuard] Not allowed, redirecting to login');
    return router.parseUrl('/login');
  }

  console.log('[authGuard] Allowed, proceeding');
  return true;
};

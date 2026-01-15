import { inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export function getFromLocalStorage(storageKey: string): string | null {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return null;
  return localStorage.getItem(storageKey);
}

export function setToLocalStorage(storageKey: string, value: string) {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return;
  localStorage.setItem(storageKey, value);
}

export function removeFromLocalStorage(storageKey: string) {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return;
  localStorage.removeItem(storageKey);
}

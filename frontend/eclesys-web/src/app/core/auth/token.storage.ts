import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private tokenKey = 'eclesys.token';
  private userKey = 'eclesys.user';

  private isBrowser() {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  setToken(token: string) {
    console.log('[TokenStorage] setToken called, isBrowser:', this.isBrowser());
    if (!this.isBrowser()) {
      console.warn('[TokenStorage] Not in browser, cannot set token');
      return;
    }
    localStorage.setItem(this.tokenKey, token);
    console.log('[TokenStorage] Token saved to localStorage');
  }

  getToken(): string | null {
    console.log('[TokenStorage] getToken called, isBrowser:', this.isBrowser());
    if (!this.isBrowser()) {
      console.warn('[TokenStorage] Not in browser, cannot get token');
      return null;
    }
    const token = localStorage.getItem(this.tokenKey);
    console.log(
      '[TokenStorage] Token from localStorage:',
      token ? 'EXISTS' : 'NULL',
    );
    return token;
  }

  clearToken() {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.tokenKey);
  }

  setUser(user: unknown) {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser<T>(): T | null {
    if (!this.isBrowser()) return null;
    let raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  clearUser() {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.userKey);
  }

  clearAll() {
    this.clearToken();
    this.clearUser();
  }
}

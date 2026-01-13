import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private tokenKey = 'eclesys.token';
  private userKey = 'eclesys.user';

  private isBrowser() {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  setToken(token: string) {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.tokenKey);
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
    try { return JSON.parse(raw) as T; } catch { return null; }
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

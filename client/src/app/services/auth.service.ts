import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../models/auth';

const TOKEN_KEY = 'ft_token';
const USER_KEY = 'ft_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/auth`;

  //Initialise from localStorage so a page refresh keeps you logged in.
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<AuthUser | null>(this.readUser());
  
  // Derived signal — the guard and the toolbar both read this.
  readonly isAuthenticated = computed(() => this.token() !== null);

  async register(req: RegisterRequest): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.base}/register`, req));
    this.setSession(res);
  }

    async login(req: LoginRequest): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.base}/login`, req),
    );
    this.setSession(res);
  }

    logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
  }
  
  private setSession(res: AuthResponse): void {
    const user: AuthUser = { name: res.name, email: res.email };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.token.set(res.token);
    this.user.set(user);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}

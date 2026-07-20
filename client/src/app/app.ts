import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('finance-tracker');

  protected auth = inject(AuthService);
  private router = inject(Router);

  protected initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
  });

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}

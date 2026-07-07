import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardSummary } from '../models/dashboard';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/Dashboard`;

  readonly summary = signal<DashboardSummary | null>(null)
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadSummary(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await firstValueFrom(
       this.http.get<DashboardSummary>(`${this.base}/summary`));
      this.summary.set(data);
    } catch {
      this.error.set('Could not load dashboard summary. Is the API running?');
    }finally {
      this.loading.set(false);
    }
  }

}

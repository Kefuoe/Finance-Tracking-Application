import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { BudgetDto, CreateBudgetRequest } from '../models/budget';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/Budgets`;

  readonly budgets = signal<BudgetDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(year: number, month: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<BudgetDto[]>(`${this.base}?year=${year}&month=${month}`));
      this.budgets.set(data);
    } catch {
      this.error.set('Could not load budgets. Is the API running on localhost:5127?');
    } finally {
      this.loading.set(false);
    }
  }

  getById(id: number) {
    return firstValueFrom(this.http.get<BudgetDto>(`${this.base}/${id}`));
  }

  async create(req: CreateBudgetRequest): Promise<BudgetDto> {
    const created = await firstValueFrom(this.http.post<BudgetDto>(this.base, req));
    this.budgets.update(list => [created, ...list]);
    return created;
  }

  async update(id: number, req: CreateBudgetRequest): Promise<BudgetDto> {
    const updated = await firstValueFrom(this.http.put<BudgetDto>(`${this.base}/${id}`, req));
    this.budgets.update(list => list.map(b => (b.id === id ? updated : b)));
    return updated;
  }

  async remove(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
    this.budgets.update(list => list.filter(b => b.id !== id));
  }
}

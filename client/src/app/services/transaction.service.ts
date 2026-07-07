import { inject, Injectable, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateTransactionRequest, TransactionDto } from '../models/transaction';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/Expenses`;

  readonly expenses = signal<TransactionDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadExpenses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
        const data = await firstValueFrom(this.http.get<TransactionDto[]>(this.base));
        this.expenses.set(data);
    } catch (err) {
        this.error.set('Could not load expenses. Is the API running on localhost:5127?');
    } finally {
        this.loading.set(false);
    }
  }

  getById(id:number) {
    return firstValueFrom(this.http.get<TransactionDto>(`${this.base}/${id}`));
  }

  async create(req: CreateTransactionRequest): Promise<TransactionDto> {
    const created = await firstValueFrom(this.http.post<TransactionDto>(this.base, req));
    this.expenses.update(list => [created, ...list]);
    return created;
  }

  async update(id: number, req: CreateTransactionRequest): Promise<TransactionDto> {
    const updated = await firstValueFrom(
      this.http.put<TransactionDto>(`${this.base}/${id}`, req));
    this.expenses.update(list => list.map(t => (t.id === id ? updated : t)));
    return updated;
  }

  async remove(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
    this.expenses.update(list => list.filter(t => t.id !== id));
  }

}
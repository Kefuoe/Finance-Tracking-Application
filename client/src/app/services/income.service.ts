import { inject, Injectable, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateTransactionRequest, TransactionDto } from '../models/transaction';


@Injectable({
  providedIn: 'root',
})
export class IncomeService {
     private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/Income`;

  readonly income = signal<TransactionDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadIncome(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<TransactionDto[]>(this.base));
      this.income.set(data);
    } catch {
      this.error.set('Could not load income. Is the API running on localhost:5127?');
    } finally {
      this.loading.set(false);
    }
  }

    getById(id: number) {
    return firstValueFrom(this.http.get<TransactionDto>(`${this.base}/${id}`));
  }

  async create(req: CreateTransactionRequest): Promise<TransactionDto> {
    const created = await firstValueFrom(this.http.post<TransactionDto>(this.base, req));
    this.income.update(list => [created, ...list]);
    return created;
  }
}



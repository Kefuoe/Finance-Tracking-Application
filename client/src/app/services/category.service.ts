import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../models/transaction';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/categories`;

  //firstValueFrom converts the Observable into a Promise that resolves with the 
  //first emitted value (the HTTP response body) and then completes.
  async getExpenseCategories(): Promise<Category[]> {
   return firstValueFrom                                     
    (this.http.get<Category[]>(`${this.base}?type=Expense`));
  }

  async getIncomeCategories(): Promise<Category[]> {
  return firstValueFrom(this.http.get<Category[]>(`${this.base}?type=Income`));
}

}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BudgetService } from '../../services/budget.service';

@Component({
  selector: 'app-budget-list',
  imports: [CurrencyPipe, RouterLink, MatCardModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './budget-list.html',
  styleUrl: './budget-list.scss',
})
export class BudgetList implements OnInit {
  protected svc = inject(BudgetService);
  loading = this.svc.loading;
  error = this.svc.error;

  private now = new Date();
  year = signal(this.now.getFullYear());
  month = signal(this.now.getMonth() + 1);

  async ngOnInit() {
    await this.svc.load(this.year(), this.month());
  }

  percent(spent: number, amount: number): number {
    if (amount <= 0) return 0;
    return Math.min(100, Math.round((spent / amount) * 100));
  }

  async delete(id: number) {
    if (confirm('Delete this budget?')) await this.svc.remove(id);
  }
}

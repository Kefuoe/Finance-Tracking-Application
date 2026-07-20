import { Component, computed, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardService } from '../../services/dashboard.service';
import { BudgetService } from '../../services/budget.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, RouterLink, MatCardModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private svc = inject(DashboardService);
  protected budgetSvc = inject(BudgetService);
  private auth = inject(AuthService);

  loading = this.svc.loading;
  error = this.svc.error;

  totalIncome = computed(() => this.svc.summary()?.totalIncome ?? 0);
  totalExpenses = computed(() => this.svc.summary()?.totalExpenses ?? 0);
  balance = computed(() => this.svc.summary()?.balance ?? 0);

  firstName = computed(() => (this.auth.user()?.name ?? '').trim().split(/\s+/)[0] || 'there');
  protected greeting = this.computeGreeting();

  private now = new Date();
  private month = this.now.getMonth() + 1;
  private year = this.now.getFullYear();

  ngOnInit() {
    this.svc.loadSummary();
    this.budgetSvc.load(this.year, this.month);
  }

  percent(spent: number, amount: number): number {
    if (amount <= 0) return 0;
    return Math.min(100, Math.round((spent / amount) * 100));
  }

  private computeGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
}

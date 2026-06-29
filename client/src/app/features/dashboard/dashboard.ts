import { Component, computed, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TransactionService } from '../../services/transaction.service';
import { IncomeService } from '../../services/income.service';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private svc = inject(TransactionService);

  expenses =this.svc.expenses;
  loading = this.svc.loading

  private incomeSvc = inject(IncomeService);
  income = this.incomeSvc.income;

  totalExpenses = computed(() => this.expenses().reduce((sum, t) => sum + t.amount, 0));
  totalIncome = computed(() => this.income().reduce((sum, t) => sum + t.amount, 0));
  balance = computed(() => this.totalIncome() - this.totalExpenses());

  ngOnInit() { this.svc.loadExpenses(); this.incomeSvc.loadIncome(); }

}

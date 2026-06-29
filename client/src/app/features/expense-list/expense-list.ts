import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../services/transaction.service';


@Component({
  selector: 'app-expense-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss',
})
export class ExpenseList implements OnInit {

  private svc = inject(TransactionService);
  expenses = this.svc.expenses;
  loading = this.svc.loading
  error = this.svc.error;

  displayedColumns = ['date', 'description', 'category', 'amount'];

  ngOnInit() {
    this.svc.loadExpenses();
  }

}

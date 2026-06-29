import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../services/transaction.service';
import { IncomeService } from '../../services/income.service';


@Component({
  selector: 'app-income-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './income-list.html',
  styleUrl: './income-list.scss',
})
export class IncomeList implements OnInit {

  private svc = inject(IncomeService);
  income = this.svc.income;
  loading = this.svc.loading
  error = this.svc.error;

  displayedColumns = ['date', 'description', 'category', 'amount'];

  ngOnInit() {
    this.svc.loadIncome();
  }

}

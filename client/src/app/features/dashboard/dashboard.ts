import { Component, computed, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private svc = inject(DashboardService);

  loading = this.svc.loading;
  error = this.svc.error;

  totalIncome = computed(() => this.svc.summary()?.totalIncome ?? 0);
  totalExpenses = computed(() => this.svc.summary()?.totalExpenses ?? 0);
  balance = computed(() => this.svc.summary()?.balance ?? 0);

  ngOnInit() {
    this.svc.loadSummary();
  }
}

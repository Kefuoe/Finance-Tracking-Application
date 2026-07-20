import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/register/register').then((m) => m.Register),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'expenses',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expense-list/expense-list').then((m) => m.ExpenseList),
  },
  {
    path: 'expenses/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expense-form/expense-form').then((m) => m.ExpenseForm),
  },
  {
    path: 'income',
    canActivate: [authGuard],
    loadComponent: () => import('./features/income-list/income-list').then((m) => m.IncomeList),
  },
  {
    path: 'budgets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/budget-list/budget-list').then((m) => m.BudgetList),
  },
  {
    path: 'budgets/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/budget-form/budget-form').then((m) => m.BudgetForm),
  },
  {
    path: 'income/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/income-form/income-form').then((m) => m.IncomeForm),
  },
  { path: '**', redirectTo: '' },
];

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
   {path: 'login', loadComponent: () => import('./features/login/login').then(m => m.Login)},
   {path: 'register', loadComponent: () => import('./features/register/register').then(m => m.Register)},

   {path: '', loadComponent: ()=> import('./features/dashboard/dashboard').then(m => m.Dashboard)},
   {path: 'expenses', loadComponent: ()=> import('./features/expense-list/expense-list').then(m => m.ExpenseList)},
   {path: 'expenses/:id', loadComponent: ()=> import('./features/expense-form/expense-form').then(m => m.ExpenseForm)},
   { path: 'income', loadComponent: () => import('./features/income-list/income-list').then(m => m.IncomeList) },
   { path: 'income/:id', loadComponent: () => import('./features/income-form/income-form').then(m => m.IncomeForm) },

   {path: '**', redirectTo: ''},
];

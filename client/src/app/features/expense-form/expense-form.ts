import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/transaction';

@Component({
  selector: 'app-expense-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatButtonModule],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.scss',
})
export class ExpenseForm implements OnInit {
 private svc = inject(TransactionService);
 private categorySvc = inject(CategoryService);
 private router = inject(Router);
 private fb = inject(FormBuilder);

 categories = signal<Category[]>([]);
 submitting = signal(false);
 error = signal<string | null>(null);

 form = this.fb.nonNullable.group({
    categoryId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    date: [new Date(), Validators.required],
    description: ['', [Validators.required, Validators.maxLength(250)]],
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    try{
      await this.svc.create({
        categoryId: v.categoryId!,
        amount: v.amount!,
        date: v.date!.toISOString(),
        description: v.description!,
      });
      this.router.navigate(['/expenses']);
    } catch (err) {
      this.error.set('Failed to save. Check the API and category id.');
    } finally {
      this.submitting.set(false);
    }
  }
  async ngOnInit() {
    try {
      this.categories.set(await this.categorySvc.getExpenseCategories());
    } catch {
      this.error.set('Could not load categories. Is the API running?');
    }
  }
}

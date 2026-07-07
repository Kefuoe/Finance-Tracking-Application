import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
 private route = inject(ActivatedRoute);
 private fb = inject(FormBuilder);

 categories = signal<Category[]>([]);
 submitting = signal(false);
 error = signal<string | null>(null);
 editId = signal<number | null>(null);
 isEdit = signal(false);

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
    const req = {
      categoryId: v.categoryId!,
      amount: v.amount!,
      date: v.date!.toISOString(),
      description: v.description!,
    };
    try {
      if (this.isEdit()) {
        await this.svc.update(this.editId()!, req);
      } else {
        await this.svc.create(req);
      }
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

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = Number(idParam);
      this.editId.set(id);
      this.isEdit.set(true);
      try {
        const t = await this.svc.getById(id);
        this.form.patchValue({
          categoryId: t.categoryId,
          amount: t.amount,
          date: new Date(t.date),
          description: t.description,
        });
      } catch {
        this.error.set('Could not load the expense to edit.');
      }
    }
  }
}

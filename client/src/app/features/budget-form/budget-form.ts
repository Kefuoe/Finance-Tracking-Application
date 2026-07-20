import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/transaction';

@Component({
  selector: 'app-budget-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './budget-form.html',
  styleUrl: './budget-form.scss',
})
export class BudgetForm implements OnInit {
  private svc = inject(BudgetService);
  private categorySvc = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  submitting = signal(false);
  error = signal<string | null>(null);
  editId = signal<number | null>(null);
  isEdit = signal(false);

  private now = new Date();
  form = this.fb.nonNullable.group({
    categoryId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    year: [this.now.getFullYear(), [Validators.required, Validators.min(2000)]],
    month: [this.now.getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
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
      year: v.year!,
      month: v.month!,
    };
    try {
      if (this.isEdit()) {
        await this.svc.update(this.editId()!, req);
      } else {
        await this.svc.create(req);
      }
      this.router.navigate(['/budgets']);
    } catch {
      this.error.set('Failed to save. A budget for that category/month may already exist.');
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
        const b = await this.svc.getById(id);
        this.form.patchValue({
          categoryId: b.categoryId, amount: b.amount, year: b.year, month: b.month,
        });
        // category/year/month are fixed once created — only amount is editable
        this.form.controls.categoryId.disable();
        this.form.controls.year.disable();
        this.form.controls.month.disable();
      } catch {
        this.error.set('Could not load the budget to edit.');
      }
    }
  }
}

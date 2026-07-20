// Matches the backend BudgetDto
export interface BudgetDto {
  id: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  year: number;
  month: number;
  spent: number;
  remaining: number;
}

// Matches the backend CreateBudgetRequest
export interface CreateBudgetRequest {
  categoryId: number;
  amount: number;
  year: number;
  month: number;
}

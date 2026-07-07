//Matches the backend TransactionDto
export interface TransactionDto{
    id: number;
    amount: number;
    date: string;                      //ISO string from Json
    description: string;
    categoryName: string;
    categoryType: string;             //"Income" or "Expense"
}

// Matches the backend CreateTransactionRequest
export interface CreateTransactionRequest {
  categoryId: number;
  amount: number;
  date: string;          // ISO string
  description: string;
}

// No GET /api/categories endpoint yet — hardcoded expense categories
// (ids must match the seeded Categories table).
export interface Category {
  id: number;
  name: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 2, name: 'Food', type: 'Expense' },
  { id: 3, name: 'Transport', type: 'Expense' },
  { id: 4, name: 'Rent', type: 'Expense' },
]
export interface Category {
  id: number;
  name: string;
  type: string;   // "Income" | "Expense"
}

//Matches the backend TransactionDto
export interface TransactionDto{
    id: number;
    amount: number;
    date: string;                      //ISO string from Json
    description: string;
    categoryId: number;
    categoryName: string;
    categoryType: string;             //"Income" or "Expense"
}


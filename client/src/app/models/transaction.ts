// Matches the backend TransactionDto
export interface TransactionDto {
  id: number;
  amount: number;
  date: string;                      // ISO string from JSON
  description: string;
  categoryId: number;
  categoryName: string;
  categoryType: string;              // "Income" or "Expense"
}

// Matches the backend CreateTransactionRequest
export interface CreateTransactionRequest {
  categoryId: number;
  amount: number;
  date: string;                      // ISO string
  description: string;
}

// Matches the backend CategoryDto
export interface Category {
  id: number;
  name: string;
  type: string;                      // "Income" | "Expense"
}

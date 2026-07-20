using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceTracker.Application.Budgets
{
    public class BudgetDtos
    {
        public record CreateBudgetRequest(
            int CategoryId,
            decimal Amount,
            int Year,
            int Month);
        
        public record BudgetDto(
            int Id,
            int CategoryId,
            string CategoryName,
            decimal Amount,
            int Year,
            int Month,
            decimal Spent,
            decimal Remaining);   // Amount - Spent (can go negative = over budget)
            
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceTracker.Application.Transactions
{
    public record CreateTransactionRequest(
    int CategoryId,
    decimal Amount,
    DateTime Date,
    string Description);

    public record TransactionDto(
        int Id,
        decimal Amount,
        DateTime Date,
        string Description,
        string CategoryName,
        string CategoryType);
}

namespace FinanceTracker.Application.Dashboard
{
    public record DashboardSummaryDto(
        decimal TotalIncome,
        decimal TotalExpenses,
        decimal Balance);
}

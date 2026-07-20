using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceTracker.Domain.Entities
{
    public class Budget
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int CategoryId { get; set; }
        public decimal Amount { get; set; } // the cap for the month
        public int Year { get; set; }       // e.g. 2026
        public int Month { get; set; }      // 1-12

        public User? User { get; set; }
        public Category? Category { get; set; }
    }
}

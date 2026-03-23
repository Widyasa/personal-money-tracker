import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomes, expenses, debts, savingsAccounts } from "@/lib/db/schema";
import { sql, eq, desc, and, gte, lte, like } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // format: YYYY-MM
    const chartFilter = searchParams.get("chart") || "monthly"; // daily | monthly | yearly

    // Date range for the selected month (for the "per month" cards)
    let dateStart = "";
    let dateEnd = "";

    if (month) {
      dateStart = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      dateEnd = `${month}-${String(lastDay).padStart(2, "0")}`;
    }

    // Build conditions for monthly-scoped queries
    const incomeMonthCondition = month
      ? and(gte(incomes.date, dateStart), lte(incomes.date, dateEnd))
      : undefined;
    const expenseMonthCondition = month
      ? and(gte(expenses.date, dateStart), lte(expenses.date, dateEnd))
      : undefined;

    // Monthly income total
    const [incomeResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${incomes.amount}), 0)` })
      .from(incomes)
      .where(incomeMonthCondition);

    // Monthly expense total
    const [expenseResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(expenseMonthCondition);

    // Total unpaid debts (not month-scoped)
    const [debtResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${debts.remainingAmount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(debts)
      .where(eq(debts.status, "UNPAID"));

    // Total savings (not month-scoped)
    const [savingsResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${savingsAccounts.balance}), 0)` })
      .from(savingsAccounts);

    // Savings breakdown by type
    const savingsBreakdown = await db
      .select({
        type: savingsAccounts.type,
        total: sql<number>`SUM(${savingsAccounts.balance})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(savingsAccounts)
      .groupBy(savingsAccounts.type);

    // Recent transactions (monthly-scoped)
    const recentIncomes = await db
      .select({ id: incomes.id, amount: incomes.amount, date: incomes.date, note: incomes.note })
      .from(incomes)
      .where(incomeMonthCondition)
      .orderBy(desc(incomes.date))
      .limit(5);

    const recentExpenses = await db
      .select({ id: expenses.id, amount: expenses.amount, date: expenses.date, note: expenses.note })
      .from(expenses)
      .where(expenseMonthCondition)
      .orderBy(desc(expenses.date))
      .limit(5);

    const recentTransactions = [
      ...recentIncomes.map((i) => ({ ...i, type: "income" as const })),
      ...recentExpenses.map((e) => ({ ...e, type: "expense" as const })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    // ─── Chart Data ──────────────────────────────────────────────
    let chartData: { label: string; income: number; expense: number }[] = [];

    if (chartFilter === "daily" && month) {
      // Daily: each day of the selected month
      const [y, m] = month.split("-").map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();

      const allIncomes = await db
        .select({ date: incomes.date, amount: incomes.amount })
        .from(incomes)
        .where(incomeMonthCondition);
      const allExpenses = await db
        .select({ date: expenses.date, amount: expenses.amount })
        .from(expenses)
        .where(expenseMonthCondition);

      const incomeByDay: Record<string, number> = {};
      const expenseByDay: Record<string, number> = {};
      allIncomes.forEach((i) => { incomeByDay[i.date] = (incomeByDay[i.date] || 0) + i.amount; });
      allExpenses.forEach((e) => { expenseByDay[e.date] = (expenseByDay[e.date] || 0) + e.amount; });

      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${month}-${String(d).padStart(2, "0")}`;
        chartData.push({
          label: String(d),
          income: incomeByDay[dateKey] || 0,
          expense: expenseByDay[dateKey] || 0,
        });
      }
    } else if (chartFilter === "yearly") {
      // Yearly: each month of current year
      const year = month ? month.split("-")[0] : String(new Date().getFullYear());

      const allIncomes = await db
        .select({ date: incomes.date, amount: incomes.amount })
        .from(incomes)
        .where(like(incomes.date, `${year}%`));
      const allExpenses = await db
        .select({ date: expenses.date, amount: expenses.amount })
        .from(expenses)
        .where(like(expenses.date, `${year}%`));

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const incomeByMonth: Record<string, number> = {};
      const expenseByMonth: Record<string, number> = {};

      allIncomes.forEach((i) => {
        const m = i.date.substring(5, 7);
        incomeByMonth[m] = (incomeByMonth[m] || 0) + i.amount;
      });
      allExpenses.forEach((e) => {
        const m = e.date.substring(5, 7);
        expenseByMonth[m] = (expenseByMonth[m] || 0) + e.amount;
      });

      for (let m = 1; m <= 12; m++) {
        const key = String(m).padStart(2, "0");
        chartData.push({
          label: months[m - 1],
          income: incomeByMonth[key] || 0,
          expense: expenseByMonth[key] || 0,
        });
      }
    } else {
      // Monthly (default): last 6 months
      const now = month ? new Date(`${month}-15`) : new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const start = `${ym}-01`;
        const end = `${ym}-${String(lastDay).padStart(2, "0")}`;

        const [inc] = await db
          .select({ total: sql<number>`COALESCE(SUM(${incomes.amount}), 0)` })
          .from(incomes)
          .where(and(gte(incomes.date, start), lte(incomes.date, end)));

        const [exp] = await db
          .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
          .from(expenses)
          .where(and(gte(expenses.date, start), lte(expenses.date, end)));

        chartData.push({
          label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
          income: inc.total,
          expense: exp.total,
        });
      }
    }

    return NextResponse.json({
      totalIncome: incomeResult.total,
      totalExpense: expenseResult.total,
      balance: incomeResult.total - expenseResult.total,
      totalUnpaidDebt: debtResult.total,
      unpaidDebtCount: debtResult.count,
      totalSavings: savingsResult.total,
      savingsBreakdown,
      recentTransactions,
      chartData,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}

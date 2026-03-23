import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  debtPayments,
  debts,
  expenses,
  expenseCategories,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const result = await db
    .select({
      id: debtPayments.id,
      debtId: debtPayments.debtId,
      debtName: debts.name,
      expenseId: debtPayments.expenseId,
      amount: debtPayments.amount,
      date: debtPayments.date,
      createdAt: debtPayments.createdAt,
    })
    .from(debtPayments)
    .leftJoin(debts, eq(debtPayments.debtId, debts.id))
    .orderBy(desc(debtPayments.date));

  return NextResponse.json(result);
}

/**
 * CRITICAL: Creating a debt payment does 3 things in a batch:
 * 1. Creates an expense entry (auto-categorized as "Debt Payment")
 * 2. Creates the debt_payment record linking debt + expense
 * 3. Updates the debt's remaining_amount (and status if fully paid)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { debtId, amount, date } = body;

    if (!debtId || !amount || !date) {
      return NextResponse.json(
        { error: "debtId, amount, and date are required" },
        { status: 400 }
      );
    }

    // Validate debt exists and is UNPAID
    const [debt] = await db
      .select()
      .from(debts)
      .where(eq(debts.id, debtId));

    if (!debt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }
    if (debt.status === "PAID") {
      return NextResponse.json(
        { error: "Debt is already fully paid" },
        { status: 400 }
      );
    }

    // Ensure "Debt Payment" expense category exists (or create it)
    let [debtPaymentCategory] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.name, "Debt Payment"));

    if (!debtPaymentCategory) {
      [debtPaymentCategory] = await db
        .insert(expenseCategories)
        .values({ name: "Debt Payment" })
        .returning();
    }

    // Step 1: Create expense entry
    const [expense] = await db
      .insert(expenses)
      .values({
        categoryId: debtPaymentCategory.id,
        amount,
        date,
        note: `Debt payment: ${debt.name}`,
      })
      .returning();

    // Step 2: Create debt payment record
    const [payment] = await db
      .insert(debtPayments)
      .values({
        debtId,
        expenseId: expense.id,
        amount,
        date,
      })
      .returning();

    // Step 3: Update debt remaining amount and status
    const newRemaining = Math.max(0, debt.remainingAmount - amount);
    const newStatus = newRemaining <= 0 ? "PAID" : "UNPAID";

    await db
      .update(debts)
      .set({
        remainingAmount: newRemaining,
        status: newStatus,
      })
      .where(eq(debts.id, debtId));

    return NextResponse.json(
      {
        payment,
        expense,
        debtUpdated: { remainingAmount: newRemaining, status: newStatus },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create debt payment:", err);
    return NextResponse.json(
      { error: "Failed to create debt payment" },
      { status: 500 }
    );
  }
}

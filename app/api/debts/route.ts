import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { debts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(debts).orderBy(desc(debts.createdAt));
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, totalAmount, notes } = body;

    if (!name?.trim() || !totalAmount) {
      return NextResponse.json(
        { error: "name and totalAmount are required" },
        { status: 400 }
      );
    }

    const [debt] = await db
      .insert(debts)
      .values({
        name: name.trim(),
        totalAmount,
        remainingAmount: totalAmount,
        status: "UNPAID",
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(debt, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create debt" }, { status: 500 });
  }
}

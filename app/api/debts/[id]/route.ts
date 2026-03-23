import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { debts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const debt = await db.query.debts.findFirst({
    where: eq(debts.id, Number(id)),
    with: { payments: true },
  });

  if (!debt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(debt);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, totalAmount, notes, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim();
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    const [updated] = await db
      .update(debts)
      .set(updateData)
      .where(eq(debts.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(debts)
      .where(eq(debts.id, Number(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

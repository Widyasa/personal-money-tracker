import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savingsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, balance } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim();
    if (type) updateData.type = type;
    if (balance !== undefined) updateData.balance = balance;

    const [updated] = await db
      .update(savingsAccounts)
      .set(updateData)
      .where(eq(savingsAccounts.id, Number(id)))
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
      .delete(savingsAccounts)
      .where(eq(savingsAccounts.id, Number(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

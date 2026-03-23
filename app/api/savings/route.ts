import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savingsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const accounts = await db.select().from(savingsAccounts).orderBy(savingsAccounts.name);
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, balance } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [account] = await db
      .insert(savingsAccounts)
      .values({
        name: name.trim(),
        type: type || "CASH",
        balance: balance || 0,
      })
      .returning();

    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

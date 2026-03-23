import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomeCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const categories = await db.select().from(incomeCategories).orderBy(incomeCategories.name);
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [category] = await db
      .insert(incomeCategories)
      .values({ name: name.trim() })
      .returning();

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

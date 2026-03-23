import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses, expenseCategories } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { uploadImage } from "@/lib/cloudinary";

export async function GET() {
  const result = await db
    .select({
      id: expenses.id,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      amount: expenses.amount,
      date: expenses.date,
      note: expenses.note,
      imageUrl: expenses.imageUrl,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .orderBy(desc(expenses.date));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const categoryId = Number(formData.get("categoryId"));
    const amount = Number(formData.get("amount"));
    const date = formData.get("date") as string;
    const note = (formData.get("note") as string) || null;
    const image = formData.get("image") as File | null;

    if (!categoryId || !amount || !date) {
      return NextResponse.json(
        { error: "categoryId, amount, and date are required" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
    if (image && image.size > 0) {
      imageUrl = await uploadImage(image, "money-tracker/expenses");
    }

    const [expense] = await db
      .insert(expenses)
      .values({ categoryId, amount, date, note, imageUrl })
      .returning();

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error("Failed to create expense:", err);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

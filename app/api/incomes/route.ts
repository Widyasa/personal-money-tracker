import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomes, incomeCategories } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { uploadImage } from "@/lib/cloudinary";

export async function GET() {
  const result = await db
    .select({
      id: incomes.id,
      categoryId: incomes.categoryId,
      categoryName: incomeCategories.name,
      amount: incomes.amount,
      date: incomes.date,
      note: incomes.note,
      imageUrl: incomes.imageUrl,
      createdAt: incomes.createdAt,
    })
    .from(incomes)
    .leftJoin(incomeCategories, eq(incomes.categoryId, incomeCategories.id))
    .orderBy(desc(incomes.date));

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
      imageUrl = await uploadImage(image, "money-tracker/incomes");
    }

    const [income] = await db
      .insert(incomes)
      .values({ categoryId, amount, date, note, imageUrl })
      .returning();

    return NextResponse.json(income, { status: 201 });
  } catch (err) {
    console.error("Failed to create income:", err);
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 });
  }
}

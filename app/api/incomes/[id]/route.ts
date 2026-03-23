import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uploadImage } from "@/lib/cloudinary";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [income] = await db
    .select()
    .from(incomes)
    .where(eq(incomes.id, Number(id)));

  if (!income) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(income);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const categoryId = Number(formData.get("categoryId"));
    const amount = Number(formData.get("amount"));
    const date = formData.get("date") as string;
    const note = (formData.get("note") as string) || null;
    const image = formData.get("image") as File | null;

    const updateData: Record<string, unknown> = { categoryId, amount, date, note };

    if (image && image.size > 0) {
      updateData.imageUrl = await uploadImage(image, "money-tracker/incomes");
    }

    const [updated] = await db
      .update(incomes)
      .set(updateData)
      .where(eq(incomes.id, Number(id)))
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
      .delete(incomes)
      .where(eq(incomes.id, Number(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

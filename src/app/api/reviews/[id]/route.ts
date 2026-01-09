import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews, servers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { updateReviewSchema } from "@/lib/validations/user-features";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;

  // Find review
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, id),
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Check ownership
  if (review.userId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { rating, content } = parsed.data;

  const [updated] = await db
    .update(reviews)
    .set({
      ...(rating !== undefined && { rating }),
      ...(content !== undefined && { content }),
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, id))
    .returning();

  // Update server average rating
  await updateServerRating(review.serverId);

  return NextResponse.json({ review: updated });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;

  // Find review
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, id),
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Check ownership
  if (review.userId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const serverId = review.serverId;

  await db.delete(reviews).where(eq(reviews.id, id));

  // Update server average rating
  await updateServerRating(serverId);

  return NextResponse.json({ success: true });
}

async function updateServerRating(serverId: string) {
  const result = await db
    .select({
      avg: sql<string>`ROUND(AVG(rating)::numeric, 1)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.serverId, serverId));

  await db
    .update(servers)
    .set({
      averageRating: result[0]?.avg ?? null,
      reviewsCount: result[0]?.count ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(servers.id, serverId));
}

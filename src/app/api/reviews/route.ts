import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews, servers } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createReviewSchema } from "@/lib/validations/user-features";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { serverId, rating, content } = parsed.data;

  // Check server exists
  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  // Check if user already has a review (upsert)
  const existingReview = await db.query.reviews.findFirst({
    where: and(eq(reviews.serverId, serverId), eq(reviews.userId, session.user.id)),
  });

  let review;

  if (existingReview) {
    // Update existing review
    const [updated] = await db
      .update(reviews)
      .set({
        rating,
        content: content ?? null,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, existingReview.id))
      .returning();
    review = updated;
  } else {
    // Create new review
    const [created] = await db
      .insert(reviews)
      .values({
        serverId,
        userId: session.user.id,
        rating,
        content: content ?? null,
      })
      .returning();
    review = created;
  }

  // Update server average rating
  await updateServerRating(serverId);

  return NextResponse.json({ review, isNew: !existingReview });
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

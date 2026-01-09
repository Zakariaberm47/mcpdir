import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ReviewList } from "./review-list";

interface ServerReviewsProps {
  serverId: string;
  serverSlug: string;
  averageRating: string | null;
  reviewsCount: number | null;
}

export async function ServerReviews({
  serverId,
  serverSlug,
  averageRating,
  reviewsCount,
}: ServerReviewsProps) {
  const session = await auth();

  // Fetch reviews with user info
  const serverReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      content: reviews.content,
      createdAt: reviews.createdAt,
      user: {
        id: users.id,
        githubUsername: users.githubUsername,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.serverId, serverId))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  // Find current user's review
  const userReview = session?.user?.id
    ? serverReviews.find((r) => r.user.id === session.user.id) ?? null
    : null;

  return (
    <ReviewList
      serverId={serverId}
      serverSlug={serverSlug}
      reviews={serverReviews}
      averageRating={averageRating}
      totalCount={reviewsCount}
      userReview={userReview}
    />
  );
}

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { RatingDisplay } from "./rating-display";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  createdAt: Date | string | null;
  user: {
    id: string;
    githubUsername: string;
    avatarUrl: string | null;
  };
}

interface ReviewListProps {
  serverId: string;
  serverSlug: string;
  reviews: Review[];
  averageRating: string | null;
  totalCount: number | null;
  userReview?: Review | null;
}

export function ReviewList({
  serverId,
  reviews,
  averageRating,
  totalCount,
  userReview,
}: ReviewListProps) {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const hasUserReview = !!userReview;
  const isLoggedIn = !!session?.user;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Reviews</h3>
          {averageRating && totalCount && totalCount > 0 && (
            <div className="flex items-center gap-2">
              <RatingDisplay rating={parseFloat(averageRating)} size="sm" showValue />
              <span className="text-sm text-muted-foreground">
                ({totalCount} {totalCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>

        {isLoggedIn && !hasUserReview && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Write Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          serverId={serverId}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit Form */}
      {editingReview && (
        <ReviewForm
          serverId={serverId}
          existingReview={{
            id: editingReview.id,
            rating: editingReview.rating,
            content: editingReview.content,
          }}
          onSuccess={() => setEditingReview(null)}
          onCancel={() => setEditingReview(null)}
        />
      )}

      {/* User's own review (shown first if exists and not editing) */}
      {userReview && !editingReview && (
        <ReviewCard
          review={userReview}
          isOwn
          onEdit={() => setEditingReview(userReview)}
        />
      )}

      {/* Other reviews */}
      {reviews
        .filter((r) => r.id !== userReview?.id)
        .map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isOwn={review.user.id === session?.user?.id}
            onEdit={
              review.user.id === session?.user?.id
                ? () => setEditingReview(review)
                : undefined
            }
          />
        ))}

      {/* Empty state */}
      {reviews.length === 0 && !showForm && (
        <GlassCard className="p-8 text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-muted-foreground">No reviews yet</p>
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(true)}
              className="mt-2"
            >
              Be the first to review
            </Button>
          )}
        </GlassCard>
      )}

      {/* Login prompt */}
      {!isLoggedIn && reviews.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Sign in to write a review
        </p>
      )}
    </div>
  );
}

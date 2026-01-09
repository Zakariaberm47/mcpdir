import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { GlassCard } from "@/components/ui/glass-card";
import { RatingDisplay } from "./rating-display";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    content: string | null;
    createdAt: Date | string | null;
    user: {
      githubUsername: string;
      avatarUrl: string | null;
    };
  };
  isOwn?: boolean;
  onEdit?: () => void;
  className?: string;
}

export function ReviewCard({
  review,
  isOwn,
  onEdit,
  className,
}: ReviewCardProps) {
  const createdAt = review.createdAt
    ? new Date(review.createdAt)
    : null;

  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
          {review.user.avatarUrl ? (
            <Image
              src={review.user.avatarUrl}
              alt={review.user.githubUsername}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              {review.user.githubUsername[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              @{review.user.githubUsername}
            </span>
            <RatingDisplay rating={review.rating} size="sm" />
            {createdAt && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            )}
            {isOwn && onEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-cyan hover:underline ml-auto"
              >
                Edit
              </button>
            )}
          </div>

          {review.content && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
              {review.content}
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

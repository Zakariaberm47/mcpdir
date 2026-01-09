"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { RatingInput } from "./rating-input";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  serverId: string;
  existingReview?: {
    id: string;
    rating: number;
    content: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({
  serverId,
  existingReview,
  onSuccess,
  onCancel,
  className,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingReview;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId,
          rating,
          content: content.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!existingReview || !confirm("Delete your review?")) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${existingReview.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete review");
      }

      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GlassCard className={cn("p-4", className)}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <RatingInput value={rating} onChange={setRating} size="lg" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Review (optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this server..."
              rows={3}
              maxLength={2000}
              className={cn(
                "w-full rounded-lg border border-[var(--glass-border)] bg-background/50",
                "px-3 py-2 text-sm placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan/50",
                "resize-none"
              )}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/2000
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update Review" : "Submit Review"}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 ml-auto"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </form>
    </GlassCard>
  );
}

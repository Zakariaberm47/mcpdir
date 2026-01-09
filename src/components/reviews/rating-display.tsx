import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function RatingDisplay({
  rating,
  size = "md",
  showValue = false,
  className,
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className={cn("text-muted-foreground ml-1", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

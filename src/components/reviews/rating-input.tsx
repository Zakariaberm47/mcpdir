"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "md" | "lg";
  className?: string;
}

export function RatingInput({
  value,
  onChange,
  size = "md",
  className,
}: RatingInputProps) {
  const [hovered, setHovered] = useState(0);

  const sizeClasses = {
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const activeRating = hovered || value;

  return (
    <div
      className={cn("flex gap-1", className)}
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan/50 rounded"
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              star <= activeRating
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30 hover:text-amber-400/50"
            )}
          />
        </button>
      ))}
    </div>
  );
}

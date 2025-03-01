import * as React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8"
};

export function StarRating({
  rating,
  onChange,
  count = 5,
  size = "md",
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  const handleMouseEnter = (index: number) => {
    setHoverRating(index);
  };
  
  const handleMouseLeave = () => {
    setHoverRating(0);
  };
  
  const handleClick = (index: number) => {
    // Toggle rating off if clicking the same star
    onChange(rating === index ? 0 : index);
  };

  return (
    <div 
      className={cn("flex items-center gap-1", className)} 
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: count }).map((_, i) => {
        const starIndex = i + 1;
        const isFilled = (hoverRating || rating) >= starIndex;
        
        return (
          <Star
            key={`star-${i}`}
            className={cn(
              sizeClasses[size],
              "cursor-pointer transition-colors duration-150",
              isFilled 
                ? "text-yellow-400 fill-yellow-400" 
                : "text-gray-300 hover:text-yellow-200"
            )}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
          />
        );
      })}
    </div>
  );
}

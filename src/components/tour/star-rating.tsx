import { Star } from "lucide-react";

type StarRatingProps = {
  rating: number;
  reviewCount?: number;
  showCount?: boolean;
};

export function StarRating({ rating, reviewCount, showCount = true }: StarRatingProps) {
  const rounded = Math.round(rating * 10) / 10;

  return (
    <div className="inline-flex items-center gap-1.5">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium">{rounded > 0 ? rounded.toFixed(1) : "Mới"}</span>
      {showCount && typeof reviewCount === "number" ? (
        <span className="text-sm text-muted-foreground">({reviewCount} đánh giá)</span>
      ) : null}
    </div>
  );
}

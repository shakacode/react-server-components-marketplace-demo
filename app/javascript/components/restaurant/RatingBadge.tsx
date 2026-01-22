interface Props {
  rating: number;  // 0.0-5.0
  count: number;   // review count
}

export function RatingBadge({ rating, count }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
      <span className="text-xl">⭐</span>
      <span className="text-xs text-gray-600">({count.toLocaleString()} reviews)</span>
    </div>
  );
}

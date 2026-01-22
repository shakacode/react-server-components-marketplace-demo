import { Restaurant } from '../../types';

interface Props {
  restaurant: Restaurant;
}

export function RestaurantCardFooter({ restaurant }: Props) {
  return (
    <div className="pt-3 border-t border-gray-200">
      <RatingBadge rating={restaurant.average_rating} count={restaurant.review_count} />
      <p className="text-xs text-gray-500 mt-2">
        {getDistance(restaurant.latitude, restaurant.longitude)} away
      </p>
    </div>
  );
}

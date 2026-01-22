import { Restaurant } from '../../types';

interface Props {
  restaurant: Restaurant;
}

export function RestaurantCardHeader({ restaurant }: Props) {
  return (
    <div className="mb-4">
      <img
        src={restaurant.image_url}
        alt={restaurant.name}
        className="w-full h-48 object-cover rounded-lg mb-3"
      />
      <h3 className="text-lg font-bold">{restaurant.name}</h3>
      <p className="text-sm text-gray-600">{restaurant.cuisine_type}</p>
      <p className="text-xs text-gray-500">{restaurant.city}, {restaurant.state}</p>
    </div>
  );
}

import { MenuItem } from '../../types';

interface Props {
  items: MenuItem[];
}

export function TrendingItems({ items }: Props) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-600 uppercase">Trending</div>
      {items.map(item => (
        <div key={item.id} className="text-sm text-gray-700">
          {item.name} ${item.price.toFixed(2)}
        </div>
      ))}
    </div>
  );
}

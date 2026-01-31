import { Promotion } from '../../types'

interface Props {
  promotions: Promotion[];
}

export function SpecialsList({ promotions }: Props) {
  if (promotions.length === 0) return null;

  return (
    <div className="space-y-2">
      {promotions.map(promo => (
        <div key={promo.id} className="bg-blue-50 p-2 rounded">
          <div className="font-semibold text-sm text-blue-900">{promo.title}</div>
          <div className="text-xs text-blue-700">{promo.description}</div>
        </div>
      ))}
    </div>
  );
}

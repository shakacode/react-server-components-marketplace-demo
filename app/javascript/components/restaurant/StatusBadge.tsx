interface Props {
  status: 'open' | 'closed' | 'custom_hours';
}

export function StatusBadge({ status }: Props) {
  const colors = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
    custom_hours: 'bg-yellow-100 text-yellow-800',
  };

  const labels = {
    open: 'Open Now',
    closed: 'Closed',
    custom_hours: 'Custom Hours',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

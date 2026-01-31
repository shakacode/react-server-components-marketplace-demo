interface Props {
  minutes: number;
}

export function WaitTimeBadge({ minutes }: Props) {
  return (
    <span className="text-sm font-medium text-gray-700">
      {minutes === 0 ? 'No Wait' : `${minutes} min wait`}
    </span>
  );
}

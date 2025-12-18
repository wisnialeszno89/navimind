type Props = {
  used: number;
  limit: number;
  resetAt: number;
};

export default function ChatLimitBar({ used, limit, resetAt }: Props) {
  const remainingMs = resetAt - Date.now();
  const hours = Math.floor(remainingMs / 1000 / 60 / 60);
  const minutes = Math.floor((remainingMs / 1000 / 60) % 60);

  const percent = Math.min(100, (used / limit) * 100);

  return (
    <div className="mb-2 text-xs text-gray-400">
      <div className="flex justify-between mb-1">
        <span>
          <strong>{used}</strong> / {limit} wiadomości
        </span>
        <span>
          reset za {hours}h {minutes}m
        </span>
      </div>

      <div className="h-1 bg-gray-700 rounded">
        <div
          className="h-1 bg-blue-500 rounded transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
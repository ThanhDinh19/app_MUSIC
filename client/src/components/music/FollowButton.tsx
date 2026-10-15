import { Check } from 'lucide-react';
import { useLibraryIds, useToggleFollow } from '../../api/me';
import { cn } from '../../lib/cn';

export function FollowButton({ artistId, className }: { artistId: string; className?: string }) {
  const { data } = useLibraryIds();
  const toggle = useToggleFollow();
  const following = data?.followedArtistIds.includes(artistId) ?? false;
  return (
    <button
      type="button"
      onClick={() => toggle.mutate({ id: artistId, on: !following })}
      aria-pressed={following}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-5 text-sm font-bold transition active:scale-95',
        following ? 'border-accent/40 bg-accent/12 text-accent' : 'border-white/18 bg-white/10 hover:bg-white/16',
        className,
      )}
    >
      {following && <Check className="size-4" />}
      {following ? 'Đang theo dõi' : 'Theo dõi'}
    </button>
  );
}

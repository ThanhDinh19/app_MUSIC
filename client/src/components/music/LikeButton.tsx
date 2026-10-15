import { Heart } from 'lucide-react';
import { useLibraryIds, useToggleFavorite } from '../../api/me';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui/Button';

export function useIsLiked(songId: string): boolean {
  const { data } = useLibraryIds();
  return data?.favoriteSongIds.includes(songId) ?? false;
}

/** Nút "thích" bài hát — cập nhật lạc quan, đồng bộ trên mọi màn hình. */
export function LikeButton({ songId, size = 'sm', className }: { songId: string; size?: 'sm' | 'md'; className?: string }) {
  const liked = useIsLiked(songId);
  const toggle = useToggleFavorite();
  return (
    <IconButton
      label={liked ? 'Bỏ thích' : 'Thích'}
      size={size}
      active={liked}
      className={cn(!liked && 'text-muted hover:text-text', className)}
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate({ id: songId, on: !liked });
      }}
    >
      <Heart className={cn(size === 'sm' ? 'size-[1.15rem]' : 'size-6', liked && 'fill-current')} />
    </IconButton>
  );
}

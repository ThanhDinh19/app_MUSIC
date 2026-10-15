import type { Artist } from '@nocturne/shared';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';
import { FollowButton } from './FollowButton';

/** Thẻ nghệ sĩ lớn (ảnh, tên, nút theo dõi, tiểu sử) — cột phải trang album. */
export function ArtistSpotlight({ artist, className }: { artist: Artist; className?: string }) {
  return (
    <section className={cn('glass overflow-hidden rounded-panel p-3', className)}>
      <Link to={`/artist/${artist.id}`} className="block overflow-hidden rounded-[1.6rem]">
        <img src={artist.imageUrl} alt={artist.name} loading="lazy" className="aspect-[2/1] w-full object-cover transition duration-700 hover:scale-[1.03]" />
      </Link>
      <div className="px-3 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <Link to={`/artist/${artist.id}`} className="truncate text-2xl font-bold hover:underline">
            {artist.name}
          </Link>
          <FollowButton artistId={artist.id} />
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{artist.bio}</p>
      </div>
    </section>
  );
}

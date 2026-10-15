import type { Album, Artist, Genre, Mood, Playlist } from '@nocturne/shared';
import { Play } from 'lucide-react';
import { Link } from 'react-router';
import { alpha, cn } from '../../lib/cn';
import { ALBUM_TYPE_LABEL, formatCompact } from '../../lib/format';
import { Cover, PlaylistCover } from './Cover';

const cardWidth = 'w-[9.5rem] shrink-0 snap-start sm:w-44 lg:w-48';

function HoverPlay() {
  return (
    <span className="absolute right-2.5 bottom-2.5 flex size-11 translate-y-2 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
      <Play className="ml-0.5 size-5 fill-current" />
    </span>
  );
}

export function AlbumCard({ album, subtitle = 'year', fluid = false }: { album: Album; subtitle?: 'year' | 'artist'; fluid?: boolean }) {
  return (
    <Link to={`/album/${album.id}`} className={cn('group block', !fluid && cardWidth)}>
      <div className="relative">
        <Cover src={album.coverUrl} alt={album.title} className="w-full shadow-[0_18px_40px_-20px_rgb(0_0_0/0.8)]" />
        <HoverPlay />
      </div>
      <div className="mt-2.5 truncate font-semibold">{album.title}</div>
      <div className="mt-0.5 truncate text-sm text-muted">
        {subtitle === 'artist' ? album.artistName : `${album.year} · ${ALBUM_TYPE_LABEL[album.type]}`}
      </div>
    </Link>
  );
}

export function ArtistCard({ artist, fluid = false }: { artist: Artist; fluid?: boolean }) {
  return (
    <Link to={`/artist/${artist.id}`} className={cn('group block text-center', !fluid && cardWidth)}>
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full shadow-[0_18px_40px_-20px_rgb(0_0_0/0.8)]">
        <img src={artist.imageUrl} alt={artist.name} loading="lazy" decoding="async" className="size-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="mt-2.5 truncate font-semibold">{artist.name}</div>
      <div className="text-sm text-muted">{formatCompact(artist.monthlyListeners)} người nghe</div>
    </Link>
  );
}

export function PlaylistCard({ playlist, fluid = false }: { playlist: Playlist; fluid?: boolean }) {
  return (
    <Link to={`/playlist/${playlist.id}`} className={cn('group block', !fluid && cardWidth)}>
      <div className="relative overflow-hidden rounded-2xl">
        <PlaylistCover coverUrl={playlist.coverUrl} previewCovers={playlist.previewCovers} name={playlist.name} className="w-full" />
        {playlist.isEditorial && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
            <div className="text-lg leading-tight font-extrabold tracking-tight text-balance">{playlist.name}</div>
          </div>
        )}
        <HoverPlay />
      </div>
      <div className="mt-2.5 truncate font-semibold">{playlist.name}</div>
      <div className="mt-0.5 line-clamp-1 text-sm text-muted">{playlist.isEditorial ? playlist.description : `${playlist.songCount} bài hát`}</div>
    </Link>
  );
}

/** Ô tâm trạng / thể loại nhiều màu cho trang Khám phá. */
export function ColorTile({ to, name, description, color, coverUrl, count }: { to: string; name: string; description?: string; color: string; coverUrl: string | null; count?: number }) {
  return (
    <Link
      to={to}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[1.5rem] border border-white/10 p-4 transition duration-300 hover:-translate-y-0.5 sm:aspect-[16/10]"
      style={{ background: `linear-gradient(150deg, ${alpha(color, 0.55)}, ${alpha(color, 0.12)} 60%, rgb(12 16 36 / 0.6))` }}
    >
      {coverUrl && (
        <img src={coverUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-35 mix-blend-screen transition duration-700 group-hover:scale-105" />
      )}
      <span className="absolute top-4 left-4 size-3 rounded-full" style={{ background: color, boxShadow: `0 0 16px ${color}` }} />
      <div className="relative">
        <div className="text-lg font-bold sm:text-xl">{name}</div>
        {description && <p className="mt-1 line-clamp-2 text-xs text-text/75 sm:text-sm">{description}</p>}
        {count !== undefined && <div className="mt-1.5 text-xs font-semibold text-text/70">{count} bài hát</div>}
      </div>
    </Link>
  );
}

export const MoodTile = ({ mood }: { mood: Mood }) => (
  <ColorTile to={`/mood/${mood.id}`} name={mood.name} description={mood.description} color={mood.color} coverUrl={mood.coverUrl} count={mood.songCount} />
);

export const GenreTile = ({ genre }: { genre: Genre }) => (
  <ColorTile to={`/genre/${genre.id}`} name={genre.name} description={genre.description} color={genre.color} coverUrl={genre.coverUrl} count={genre.songCount} />
);

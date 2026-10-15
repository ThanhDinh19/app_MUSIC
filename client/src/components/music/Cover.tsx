import { ListMusic } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn';

interface CoverProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  rounded?: string;
  eager?: boolean;
}

/** Ảnh bìa vuông, tải lười, có nền giữ chỗ khi chưa tải xong. */
export function Cover({ src, alt, className, rounded = 'rounded-2xl', eager }: CoverProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn('relative aspect-square shrink-0 overflow-hidden bg-white/8', rounded, className)}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={cn('size-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </div>
  );
}

/** Ảnh bìa playlist: ảnh riêng, hoặc ghép 4 ảnh bìa bài hát, hoặc gradient trống. */
export function PlaylistCover({ coverUrl, previewCovers, name, className, rounded = 'rounded-2xl' }: { coverUrl: string | null; previewCovers: string[]; name: string; className?: string; rounded?: string }) {
  if (coverUrl || previewCovers.length === 1) {
    return <Cover src={coverUrl ?? previewCovers[0]} alt={name} className={className} rounded={rounded} />;
  }
  if (previewCovers.length === 0) {
    return (
      <div className={cn('flex aspect-square shrink-0 items-center justify-center bg-gradient-to-br from-[#3b3a8f] via-[#5b3a8f] to-[#b13f7e]', rounded, className)}>
        <ListMusic className="size-1/3 text-white/80" />
      </div>
    );
  }
  const tiles = [0, 1, 2, 3].map((i) => previewCovers[i % previewCovers.length]!);
  return (
    <div className={cn('grid aspect-square shrink-0 grid-cols-2 overflow-hidden bg-white/8', rounded, className)}>
      {tiles.map((src, i) => (
        <img key={i} src={src} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      ))}
    </div>
  );
}

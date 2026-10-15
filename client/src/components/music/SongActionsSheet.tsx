import type { Song } from '@nocturne/shared';
import { Disc3, Heart, ListEnd, ListPlus, MicVocal, Share2, Trash, User, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useRemoveFromPlaylist, useToggleFavorite } from '../../api/me';
import { usePlayerStore } from '../../features/player/player.store';
import { useOverlay } from '../../hooks/useOverlay';
import { toast } from '../../features/ui/toast.store';
import { type SongSheetContext, useUiStore } from '../../features/ui/ui.store';
import { Sheet, SheetAction } from '../ui/Sheet';
import { Cover } from './Cover';
import { useIsLiked } from './LikeButton';
import { MoodChip } from './MoodChip';

/** Bảng thao tác cho một bài hát (nút "..." hoặc nhấn giữ). */
export function SongActionsSheet() {
  const sheet = useUiStore((s) => s.songSheet);
  const close = useUiStore((s) => s.closeSongSheet);
  if (!sheet) return null;
  return <SongActionsContent key={sheet.song.id} song={sheet.song} context={sheet.context} onClose={close} />;
}

function SongActionsContent({ song, context, onClose }: { song: Song; context: SongSheetContext; onClose: () => void }) {
  const openAddToPlaylist = useUiStore((s) => s.openAddToPlaylist);
  const navigate = useNavigate();
  const liked = useIsLiked(song.id);
  const toggleFavorite = useToggleFavorite();
  const removeFromPlaylist = useRemoveFromPlaylist();
  const playNext = usePlayerStore((s) => s.playNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const isCurrent = usePlayerStore((s) => s.queue[s.index]?.song.id === song.id);
  const openLyricsSheet = useUiStore((s) => s.openLyricsSheet);
  const setLyricsOpen = useUiStore((s) => s.setLyricsOpen);
  const player = useOverlay('player');

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const share = async () => {
    const url = new URL(`/album/${song.albumId}`, window.location.origin).href;
    const text = `${song.title} — ${song.artistName}`;
    try {
      if (navigator.share) await navigator.share({ title: text, text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Đã sao chép liên kết');
      }
    } catch {
      /* người dùng huỷ chia sẻ */
    }
  };

  return (
    <Sheet open onClose={onClose} title="Tuỳ chọn bài hát" hideHeader>
      <div className="flex items-center gap-4 border-b border-line px-5 pt-4 pb-4 sm:pt-6">
        <Cover src={song.coverUrl} alt={song.albumTitle} className="size-16" rounded="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold">{song.title}</div>
          <div className="truncate text-sm text-muted">
            {song.artistName} · {song.albumTitle}
          </div>
          <MoodChip mood={song.mood} size="sm" className="mt-2" />
        </div>
      </div>
      <div className="py-2">
        <SheetAction
          icon={<Heart className={liked ? 'size-5 fill-current' : 'size-5'} />}
          label={liked ? 'Bỏ khỏi Bài hát đã thích' : 'Thêm vào Bài hát đã thích'}
          active={liked}
          onClick={run(() => toggleFavorite.mutate({ id: song.id, on: !liked }))}
        />
        <SheetAction icon={<ListPlus className="size-5" />} label="Thêm vào playlist" onClick={() => openAddToPlaylist(song)} />
        <SheetAction
          icon={<ListEnd className="size-5 -scale-y-100" />}
          label="Phát tiếp theo"
          onClick={run(() => {
            playNext(song);
            toast('Sẽ phát tiếp theo');
          })}
        />
        <SheetAction
          icon={<ListEnd className="size-5" />}
          label="Thêm vào danh sách chờ"
          onClick={run(() => {
            addToQueue(song);
            toast('Đã thêm vào danh sách chờ');
          })}
        />
        {context.queueUid && (
          <SheetAction icon={<X className="size-5" />} label="Xoá khỏi danh sách chờ" onClick={run(() => removeFromQueue(context.queueUid!))} />
        )}
        {context.playlistId && (
          <SheetAction
            icon={<Trash className="size-5" />}
            label="Xoá khỏi playlist này"
            tone="danger"
            onClick={run(() => removeFromPlaylist.mutate({ playlistId: context.playlistId!, songId: song.id }))}
          />
        )}
        <div className="my-2 h-px bg-line" />
        <SheetAction
          icon={<MicVocal className="size-5" />}
          label="Xem lời bài hát"
          onClick={() => {
            if (isCurrent) {
              // Bài đang phát: mở trình phát ở chế độ lời chạy theo nhạc.
              setLyricsOpen(true);
              onClose();
              player.open();
            } else {
              openLyricsSheet(song);
            }
          }}
        />
        <SheetAction icon={<Disc3 className="size-5" />} label="Xem album" onClick={run(() => navigate(`/album/${song.albumId}`))} />
        <SheetAction icon={<User className="size-5" />} label="Xem nghệ sĩ" onClick={run(() => navigate(`/artist/${song.artistId}`))} />
        <SheetAction icon={<Share2 className="size-5" />} label="Chia sẻ" onClick={run(() => void share())} />
      </div>
    </Sheet>
  );
}

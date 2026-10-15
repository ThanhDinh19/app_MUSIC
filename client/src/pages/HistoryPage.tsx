import type { HistoryEntry } from '@nocturne/shared';
import { Clock, Trash } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useClearHistory, useHistory } from '../api/me';
import { SongRow } from '../components/music/SongRow';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { usePlayerStore } from '../features/player/player.store';
import { clockTime, dayLabel } from '../lib/format';

export default function HistoryPage() {
  const { data, isLoading, error, refetch } = useHistory();
  const clear = useClearHistory();
  const playSongs = usePlayerStore((s) => s.playSongs);
  const [confirm, setConfirm] = useState(false);

  const entries = data ?? [];
  const songs = entries.map((e) => e.song);
  const context = { type: 'history' as const, id: 'history', label: 'Nghe gần đây' };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.9rem] font-extrabold tracking-tight sm:text-4xl">Nghe gần đây</h1>
          <p className="mt-1 text-muted">Lịch sử nghe nhạc trên thiết bị này.</p>
        </div>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" icon={<Trash className="size-4" />} onClick={() => setConfirm(true)}>
            Xoá lịch sử
          </Button>
        )}
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        )}
        {error && <ErrorState error={error} onRetry={() => void refetch()} />}
        {data && entries.length === 0 && (
          <EmptyState
            icon={<Clock className="size-7" />}
            title="Chưa có lịch sử nghe"
            description="Những bài bạn nghe sẽ xuất hiện ở đây."
            action={
              <Link to="/">
                <Button variant="primary">Bắt đầu nghe</Button>
              </Link>
            }
          />
        )}
        {groupByDay(entries).map(([label, group]) => (
          <section key={label} className="mb-8">
            <h2 className="mb-2 px-2 text-sm font-bold tracking-wider text-muted uppercase">{label}</h2>
            <div className="space-y-0.5">
              {group.map(({ entry, index }) => (
                <SongRow
                  key={entry.id}
                  song={entry.song}
                  showCover
                  showAlbum
                  onPlay={() => playSongs(songs, index, context)}
                  trailing={<span className="mr-1 hidden text-xs tabular-nums text-faint sm:inline">{clockTime(entry.playedAt)}</span>}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Xoá lịch sử nghe?">
        <div className="px-5 pb-2">
          <p className="text-muted">Toàn bộ lịch sử nghe nhạc sẽ bị xoá. Bài hát đã thích và playlist không bị ảnh hưởng.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Huỷ
            </Button>
            <Button variant="danger" disabled={clear.isPending} onClick={() => clear.mutate(undefined, { onSuccess: () => setConfirm(false) })}>
              Xoá lịch sử
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function groupByDay(entries: HistoryEntry[]): [string, { entry: HistoryEntry; index: number }[]][] {
  const groups = new Map<string, { entry: HistoryEntry; index: number }[]>();
  entries.forEach((entry, index) => {
    const label = dayLabel(entry.playedAt);
    groups.set(label, [...(groups.get(label) ?? []), { entry, index }]);
  });
  return [...groups.entries()];
}

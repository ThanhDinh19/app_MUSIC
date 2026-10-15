import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAddToPlaylist, useCreatePlaylist, useMyPlaylists, useUpdatePlaylist } from '../../api/me';
import { type PlaylistForm, useUiStore } from '../../features/ui/ui.store';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Skeleton } from '../ui/States';
import { PlaylistCover } from './Cover';

/** Chọn playlist để thêm bài hát vào. */
export function AddToPlaylistSheet() {
  const song = useUiStore((s) => s.addToPlaylistSong);
  const close = useUiStore((s) => s.closeAddToPlaylist);
  const openForm = useUiStore((s) => s.openPlaylistForm);
  const { data: playlists, isLoading } = useMyPlaylists();
  const add = useAddToPlaylist();

  if (!song) return null;
  return (
    <Sheet open onClose={close} title="Thêm vào playlist">
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => openForm({ mode: 'create', songId: song.id })}
          className="flex w-full items-center gap-4 rounded-2xl p-2 text-left transition hover:bg-white/6"
        >
          <span className="flex size-14 items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/5">
            <Plus className="size-6" />
          </span>
          <span className="font-semibold">Tạo playlist mới</span>
        </button>
        {isLoading && <Skeleton className="m-2 h-14" />}
        {playlists?.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate({ playlistId: p.id, songId: song.id }, { onSuccess: close })}
            className="flex w-full items-center gap-4 rounded-2xl p-2 text-left transition hover:bg-white/6 disabled:opacity-60"
          >
            <PlaylistCover coverUrl={p.coverUrl} previewCovers={p.previewCovers} name={p.name} className="size-14" rounded="rounded-xl" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{p.name}</span>
              <span className="text-sm text-muted">{p.songCount} bài hát</span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/** Form tạo mới / đổi tên playlist. */
export function PlaylistFormSheet() {
  const form = useUiStore((s) => s.playlistForm);
  const close = useUiStore((s) => s.closePlaylistForm);
  if (!form) return null;
  return <PlaylistFormContent key={form.mode === 'edit' ? form.playlist.id : 'create'} form={form} onClose={close} />;
}

function PlaylistFormContent({ form, onClose }: { form: PlaylistForm; onClose: () => void }) {
  const navigate = useNavigate();
  const create = useCreatePlaylist();
  const update = useUpdatePlaylist();
  const [name, setName] = useState(form.mode === 'edit' ? form.playlist.name : '');
  const [description, setDescription] = useState(form.mode === 'edit' ? form.playlist.description : '');
  const pending = create.isPending || update.isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { name: name.trim(), description: description.trim() };
    if (!input.name) return;
    if (form.mode === 'create') {
      create.mutate(
        { ...input, songId: form.songId },
        {
          onSuccess: (playlist) => {
            onClose();
            if (!form.songId) navigate(`/playlist/${playlist.id}`);
          },
        },
      );
    } else {
      update.mutate({ id: form.playlist.id, input }, { onSuccess: onClose });
    }
  };

  return (
    <Sheet open onClose={onClose} title={form.mode === 'create' ? 'Playlist mới' : 'Sửa playlist'}>
      <form onSubmit={submit} className="space-y-4 px-5 pt-2 pb-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-muted">Tên playlist</span>
          <input
            data-autofocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Ví dụ: Nhạc chạy bộ"
            className="h-12 w-full rounded-xl border border-white/12 bg-white/6 px-4 text-base outline-none placeholder:text-faint focus:border-accent/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-muted">Mô tả (không bắt buộc)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            className="w-full resize-none rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-base outline-none placeholder:text-faint focus:border-accent/60"
          />
        </label>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant="primary" disabled={!name.trim() || pending}>
            {form.mode === 'create' ? 'Tạo playlist' : 'Lưu'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

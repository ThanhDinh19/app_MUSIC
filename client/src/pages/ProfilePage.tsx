import { useQueryClient } from '@tanstack/react-query';
import { Check, Download, Info, LogOut, Moon, RotateCcw, Share, ShieldCheck, Smartphone } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { logout, useAuthConfig } from '../api/auth';
import { useMe, useUpdateMe } from '../api/me';
import { Avatar } from '../components/layout/Avatar';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { Toggle } from '../components/ui/Toggle';
import { GoogleG } from '../features/auth/GoogleLoginSection';
import { ZaloBadge } from '../features/auth/ZaloLogin';
import { usePlayerStore } from '../features/player/player.store';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { getGuestId, resetGuestId } from '../lib/guest';

export default function ProfilePage() {
  const { data: me } = useMe();
  const { data: authConfig } = useAuthConfig();
  const update = useUpdateMe();
  const [name, setName] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const qc = useQueryClient();
  const install = usePwaInstall();
  const isMember = me?.kind === 'member';

  useEffect(() => {
    if (me) setName(me.displayName);
  }, [me]);

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== me?.displayName) update.mutate({ displayName: trimmed });
  };

  const resetData = () => {
    resetGuestId();
    usePlayerStore.getState().pause();
    qc.clear();
    window.location.assign('/');
  };

  const joined = me ? new Date(me.createdAt).toLocaleDateString('vi-VN') : '';
  const subtitle = !me
    ? ''
    : isMember
      ? [me.email, me.phone].filter(Boolean).join(' · ') || `Thành viên từ ${joined}`
      : `Tài khoản khách · tham gia ${joined}`;

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <Avatar size="xl" />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{me?.displayName ?? '...'}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      {me && !isMember && (
        <section className="mt-8 overflow-hidden rounded-panel bg-gradient-to-br from-[#2b3f86] via-[#4d2f8a] to-[#9b3a7e] p-6 shadow-[0_30px_60px_-30px_rgb(155_58_126/0.8)]">
          <ShieldCheck className="size-8" />
          <h2 className="mt-4 text-xl font-bold">Đăng nhập để giữ thư viện của bạn</h2>
          <p className="mt-1 text-sm text-white/80">
            Hiện dữ liệu chỉ nằm trên thiết bị này. Đăng nhập bằng Google hoặc Zalo để dùng trên điện thoại khác và không lo mất khi xoá dữ liệu trình duyệt.
          </p>
          <Link to="/login?from=/profile" className="mt-5 inline-block">
            <Button variant="primary">Đăng nhập</Button>
          </Link>
        </section>
      )}

      {me && isMember && (
        <section className="glass mt-8 rounded-panel p-5 sm:p-6">
          <h2 className="font-bold">Tài khoản</h2>
          <p className="mt-1 text-sm text-muted">Các cách đăng nhập vào tài khoản này.</p>
          <div className="mt-4 divide-y divide-line">
            <ProviderRow
              icon={<GoogleG className="size-8" />}
              name="Google"
              detail={me.providers.includes('google') ? (me.email ?? 'Đã liên kết') : null}
              available={authConfig?.google.enabled ?? false}
            />
            <ProviderRow
              icon={<ZaloBadge />}
              name="Zalo"
              detail={me.providers.includes('zalo') ? (me.phone ?? 'Đã liên kết') : null}
              available={authConfig?.zalo.enabled ?? false}
            />
          </div>
          <Button variant="ghost" className="mt-4 -ml-3 text-danger hover:text-danger" icon={<LogOut className="size-4" />} onClick={() => setConfirmLogout(true)}>
            Đăng xuất
          </Button>
        </section>
      )}

      <section className="glass mt-5 rounded-panel p-5 sm:p-6">
        <h2 className="font-bold">Tên hiển thị</h2>
        <form onSubmit={saveName} className="mt-3 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-label="Tên hiển thị"
            className="h-12 min-w-0 flex-1 rounded-xl border border-white/12 bg-white/6 px-4 text-base outline-none focus:border-accent/60"
          />
          <Button type="submit" variant="primary" disabled={!name.trim() || name.trim() === me?.displayName} icon={<Check className="size-4" />}>
            Lưu
          </Button>
        </form>
      </section>

      <section className="glass mt-5 rounded-panel p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Moon className="mt-0.5 size-6 shrink-0 text-accent" />
          <div className="flex-1">
            <h2 className="font-bold">Mood sync</h2>
            <p className="mt-1 text-sm text-muted">Màu nền ứng dụng thay đổi theo tâm trạng của bài hát đang phát.</p>
          </div>
          <Toggle checked={me?.preferences.moodSync ?? true} label="Mood sync" onChange={(v) => update.mutate({ preferences: { moodSync: v } })} />
        </div>
      </section>

      <section className="glass mt-5 rounded-panel p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Smartphone className="mt-0.5 size-6 shrink-0 text-accent" />
          <div className="flex-1">
            <h2 className="font-bold">Ứng dụng trên điện thoại</h2>
            {install.isInstalled ? (
              <p className="mt-1 text-sm text-muted">Nocturne đã được cài trên thiết bị này. 🎉</p>
            ) : install.canPrompt ? (
              <>
                <p className="mt-1 text-sm text-muted">Cài Nocturne lên màn hình chính để mở nhanh và nghe toàn màn hình.</p>
                <Button variant="primary" size="sm" className="mt-3" icon={<Download className="size-4" />} onClick={() => void install.promptInstall()}>
                  Cài đặt ứng dụng
                </Button>
              </>
            ) : install.needsIosHint ? (
              <p className="mt-1 text-sm text-muted">
                Trên iPhone: mở bằng Safari, nhấn <Share className="mx-0.5 inline size-4 -translate-y-0.5" /> <b>Chia sẻ</b> → <b>Thêm vào MH chính</b>.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Mở trang này bằng Chrome (Android) hoặc Safari (iPhone) qua HTTPS, rồi chọn “Cài đặt ứng dụng” / “Thêm vào màn hình chính”.
              </p>
            )}
          </div>
        </div>
      </section>

      {me && !isMember && (
        <section className="glass mt-5 rounded-panel p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <RotateCcw className="mt-0.5 size-6 shrink-0 text-accent" />
            <div className="flex-1">
              <h2 className="font-bold">Dữ liệu khách</h2>
              <p className="mt-1 text-sm text-muted">
                Playlist, bài hát đã thích và lịch sử nghe đang được lưu theo mã khách của thiết bị này:{' '}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-text">{getGuestId().slice(0, 8)}…</code>
              </p>
              <Button variant="ghost" size="sm" className="mt-3 -ml-3" onClick={() => setConfirmReset(true)}>
                Bắt đầu lại với thư viện trống
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="mt-5 flex items-start gap-4 px-5 text-sm text-muted sm:px-6">
        <Info className="mt-0.5 size-5 shrink-0" />
        <p>Nocturne · phiên bản 1.0. Toàn bộ nhạc và hình ảnh demo được tạo tự động bằng code nên không vướng bản quyền.</p>
      </section>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Bắt đầu lại?">
        <div className="px-5 pb-2">
          <p className="text-muted">Thiết bị sẽ nhận mã khách mới với thư viện trống. Dữ liệu cũ vẫn nằm trên máy chủ nhưng không còn hiển thị ở đây.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Huỷ
            </Button>
            <Button variant="danger" onClick={resetData}>
              Bắt đầu lại
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Đăng xuất?">
        <div className="px-5 pb-2">
          <p className="text-muted">Thư viện của bạn vẫn được lưu trong tài khoản. Đăng nhập lại bất cứ lúc nào để tiếp tục.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmLogout(false)}>
              Huỷ
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmLogout(false);
                void logout();
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function ProviderRow({ icon, name, detail, available }: { icon: ReactNode; name: string; detail: string | null; available: boolean }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <span className="flex w-10 justify-center">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{name}</div>
        <div className="truncate text-sm text-muted">{detail ?? 'Chưa liên kết'}</div>
      </div>
      {detail ? (
        <Check className="size-5 text-accent" aria-label="Đã liên kết" />
      ) : (
        available && (
          <Link to="/login?from=/profile">
            <Button size="sm">Liên kết</Button>
          </Link>
        )
      )}
    </div>
  );
}


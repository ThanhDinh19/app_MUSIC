import { useState } from 'react';
import { Link } from 'react-router';
import { useMe } from '../../api/me';
import { cn } from '../../lib/cn';

/** Ảnh đại diện: ảnh tài khoản (Google) nếu có, ngược lại là chữ viết tắt trên nền gradient như thiết kế. */
export function Avatar({ className, size = 'md' }: { className?: string; size?: 'md' | 'xl' }) {
  const { data: me } = useMe();
  const [broken, setBroken] = useState(false);
  const showImage = !!me?.avatarUrl && !broken;

  return (
    <Link
      to="/profile"
      aria-label="Hồ sơ của bạn"
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff6fa8] via-[#ff8a7a] to-[#ffb46b] font-bold text-[#2a0f1f] shadow-[0_8px_24px_-8px_rgb(255_120_150/0.7)] ring-2 ring-white/15 transition hover:scale-105',
        size === 'md' ? 'size-11 text-[0.95rem]' : 'size-24 text-3xl',
        className,
      )}
    >
      {showImage ? (
        <img src={me.avatarUrl!} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="size-full object-cover" />
      ) : (
        (me?.initials ?? '')
      )}
    </Link>
  );
}

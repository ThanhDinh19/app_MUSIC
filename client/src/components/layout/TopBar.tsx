import { ChevronLeft, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useMe, useUpdateMe } from '../../api/me';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { Avatar } from './Avatar';
import { Logo } from './Logo';

const NAV = [
  { to: '/', label: 'Nghe ngay', end: true },
  { to: '/discover', label: 'Khám phá' },
  { to: '/library', label: 'Thư viện' },
  { to: '/search', label: 'Tìm kiếm' },
];

const ROOT_PATHS = ['/', '/discover', '/search', '/library'];

export function MoodSyncToggle({ compact = false }: { compact?: boolean }) {
  const { data: me } = useMe();
  const update = useUpdateMe();
  const checked = me?.preferences.moodSync ?? true;
  return (
    <div className={cn('flex items-center gap-3 rounded-full border border-white/12 bg-white/8', compact ? 'h-11 px-2.5' : 'h-[3.25rem] pr-5 pl-3')}>
      <Toggle checked={checked} label="Mood sync — đổi màu nền theo tâm trạng bài đang phát" onChange={(v) => update.mutate({ preferences: { moodSync: v } })} />
      {!compact && <span className="text-[0.95rem] font-semibold">Mood sync</span>}
    </div>
  );
}

/** Thanh trên cùng: điện thoại hiện logo hoặc nút quay lại; màn hình rộng hiện menu dạng "viên thuốc" như thiết kế. */
export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = ROOT_PATHS.includes(location.pathname);
  const { data: me } = useMe();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 pt-[var(--safe-top)] transition-[background,box-shadow] duration-300 lg:static lg:bg-transparent lg:shadow-none lg:backdrop-blur-none',
        scrolled && 'bg-ink/70 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-28 lg:px-10">
        <div className="flex min-w-0 items-center gap-2">
          {!isRoot && (
            <IconButton label="Quay lại" className="-ml-2 lg:hidden" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>
              <ChevronLeft className="size-7" />
            </IconButton>
          )}
          <Link to="/" className={cn(!isRoot && 'hidden lg:inline-flex')} aria-label="Nocturne — trang chủ">
            <Logo />
          </Link>
        </div>

        <nav aria-label="Điều hướng chính" className="hidden rounded-full border border-white/12 bg-white/8 p-1.5 backdrop-blur-xl lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-6 py-3 text-[1.02rem] font-semibold transition duration-200',
                  isActive ? 'bg-white text-ink shadow-lg' : 'text-muted hover:text-text',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <MoodSyncToggle />
          </div>
          <IconButton label="Tìm kiếm" variant="glass" size="lg" className="hidden lg:inline-flex" onClick={() => navigate('/search')}>
            <Search className="size-5" />
          </IconButton>
          <div className="lg:hidden">
            <MoodSyncToggle compact />
          </div>
          {me?.kind === 'guest' && (
            <Link
              to={`/login?from=${encodeURIComponent(location.pathname)}`}
              className="hidden h-14 items-center rounded-full bg-white px-6 font-semibold text-ink transition hover:bg-white/90 lg:inline-flex"
            >
              Đăng nhập
            </Link>
          )}
          <Avatar className="lg:size-14 lg:text-lg" />
        </div>
      </div>
    </header>
  );
}

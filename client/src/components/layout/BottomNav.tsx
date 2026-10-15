import { Compass, House, Library, Search } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/', label: 'Trang chủ', icon: House, end: true },
  { to: '/discover', label: 'Khám phá', icon: Compass },
  { to: '/search', label: 'Tìm kiếm', icon: Search },
  { to: '/library', label: 'Thư viện', icon: Library },
];

/** Thanh điều hướng dưới cùng cho điện thoại. */
export function BottomNav() {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="glass-strong fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0 pb-[var(--safe-bottom)] lg:hidden"
    >
      <div className="mx-auto grid h-[var(--nav-h)] max-w-lg grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold transition active:scale-95',
                isActive ? 'text-text' : 'text-faint',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex h-8 w-14 items-center justify-center rounded-full transition', isActive && 'bg-white/14')}>
                  <Icon className="size-[1.35rem]" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

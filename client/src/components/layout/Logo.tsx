import { cn } from '../../lib/cn';

/** Logo: các vạch sóng âm + trăng lưỡi liềm. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="80 80 380 352" className={className} aria-hidden>
      <defs>
        <mask id="logo-crescent">
          <rect x="0" y="0" width="512" height="512" fill="#fff" />
          <circle cx="420" cy="112" r="46" fill="#000" />
        </mask>
      </defs>
      <g stroke="currentColor" strokeWidth="30" strokeLinecap="round">
        <line x1="112" y1="212" x2="112" y2="300" />
        <line x1="168" y1="160" x2="168" y2="352" />
        <line x1="224" y1="112" x2="224" y2="400" />
        <line x1="280" y1="168" x2="280" y2="344" />
        <line x1="336" y1="220" x2="336" y2="292" />
      </g>
      <circle cx="396" cy="134" r="50" fill="currentColor" mask="url(#logo-crescent)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-8 text-white" />
      <span className="text-[1.6rem] leading-none font-bold tracking-[-0.03em]">nocturne</span>
    </span>
  );
}

import { extendTailwindMerge } from 'tailwind-merge';

/** tailwind-merge biết thêm các token màu/bo góc riêng của dự án (khai báo trong styles/index.css). */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: ['ink', 'ink-2', 'ink-3', 'text', 'muted', 'faint', 'line', 'accent', 'accent-strong', 'rose', 'danger'],
      radius: ['card', 'panel'],
    },
  },
});

/** Ghép className, bỏ giá trị rỗng và để class truyền sau ghi đè class xung đột (vd. `size-11` → `size-14`). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}

/** "#5cc8f0" + 0.3 → "rgb(92 200 240 / 0.3)" */
export function alpha(hex: string, opacity: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${opacity})`;
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

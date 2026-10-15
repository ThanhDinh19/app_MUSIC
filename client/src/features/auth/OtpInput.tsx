import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
}

/**
 * Ô nhập mã OTP: một ô input thật (hỗ trợ dán, tự điền "one-time-code", bàn phím số)
 * phủ trong suốt lên các ô hiển thị từng chữ số.
 */
export function OtpInput({ value, onChange, onComplete, length = 6, invalid, disabled }: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <div className="grid grid-cols-6 gap-2 sm:gap-3" aria-hidden>
        {Array.from({ length }, (_, i) => {
          const active = focused && (i === value.length || (i === length - 1 && value.length === length));
          return (
            <div
              key={i}
              className={cn(
                'flex aspect-[4/5] items-center justify-center rounded-2xl border bg-white/6 text-2xl font-bold tabular-nums transition',
                invalid ? 'border-danger/70' : active ? 'border-accent shadow-[0_0_0_3px_rgb(125_211_252/0.2)]' : 'border-white/14',
              )}
            >
              {value[i] ?? (active ? <span className="h-7 w-0.5 animate-pulse bg-accent" /> : '')}
            </div>
          );
        })}
      </div>
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        aria-label={`Mã xác nhận ${length} chữ số`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, length);
          onChange(digits);
          if (digits.length === length) onComplete?.(digits);
        }}
        className="absolute inset-0 size-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
      />
    </div>
  );
}

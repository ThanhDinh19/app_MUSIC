import type { SendOtpResult } from '@nocturne/shared';
import { FlaskConical, MessageCircle, Phone } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useSendOtp, useVerifyOtp } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { ApiError, errorMessage } from '../../lib/api';
import { cn } from '../../lib/cn';
import { OtpInput } from './OtpInput';
import { formatPhoneInput, isValidVnPhone } from './phone';

/** Biểu tượng thương hiệu dạng chữ (không dùng logo gốc). */
export function ZaloBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center justify-center rounded-lg bg-[#0068ff] px-1.5 text-[0.7rem] leading-5 font-extrabold tracking-normal text-white normal-case', className)}>
      Zalo
    </span>
  );
}

/**
 * Đăng nhập bằng số điện thoại Zalo:
 *  1. Nhập số → server gửi mã 6 số qua tin nhắn Zalo (ZNS).
 *  2. Nhập mã → đăng nhập.
 */
export function ZaloLogin({ mode, onSuccess }: { mode: 'console' | 'zalo'; onSuccess: () => void }) {
  const [phone, setPhone] = useState('');
  const [challenge, setChallenge] = useState<SendOtpResult | null>(null);

  if (!challenge) {
    return <PhoneStep phone={phone} setPhone={setPhone} mode={mode} onSent={setChallenge} />;
  }
  return <CodeStep phone={phone} challenge={challenge} mode={mode} onResent={setChallenge} onChangePhone={() => setChallenge(null)} onSuccess={onSuccess} />;
}

function PhoneStep({ phone, setPhone, mode, onSent }: { phone: string; setPhone: (v: string) => void; mode: 'console' | 'zalo'; onSent: (c: SendOtpResult) => void }) {
  const send = useSendOtp();
  const [touched, setTouched] = useState(false);
  const valid = isValidVnPhone(phone);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    send.mutate({ phone }, { onSuccess: onSent });
  };

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="zalo-phone" className="mb-2 block text-sm font-semibold text-muted">
        Số điện thoại Zalo
      </label>
      <div
        className={cn(
          'flex h-14 items-center gap-3 rounded-2xl border bg-white/6 px-4 transition focus-within:border-accent/60',
          touched && !valid ? 'border-danger/60' : 'border-white/14',
        )}
      >
        <Phone className="size-5 shrink-0 text-muted" aria-hidden />
        <input
          id="zalo-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0912 345 678"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          onBlur={() => setTouched(true)}
          className="h-full min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-wide outline-none placeholder:font-normal placeholder:text-faint"
        />
      </div>
      {touched && !valid && phone && <p className="mt-2 text-sm text-danger">Số điện thoại chưa đúng. Ví dụ: 0912 345 678.</p>}
      {send.error && <p className="mt-2 text-sm text-danger">{errorMessage(send.error)}</p>}

      <Button type="submit" variant="primary" disabled={send.isPending} className="mt-4 h-13 w-full bg-[#0068ff] text-white hover:bg-[#1a78ff]" icon={<MessageCircle className="size-5" />}>
        {send.isPending ? 'Đang gửi mã…' : 'Gửi mã qua Zalo'}
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-faint">
        {mode === 'zalo'
          ? 'Mã xác nhận 6 số sẽ được gửi qua tin nhắn Zalo tới số điện thoại này.'
          : 'Chế độ thử nghiệm: mã sẽ hiện ngay trên màn hình và trong terminal của server.'}
      </p>
    </form>
  );
}

function CodeStep({
  phone,
  challenge,
  mode,
  onResent,
  onChangePhone,
  onSuccess,
}: {
  phone: string;
  challenge: SendOtpResult;
  mode: 'console' | 'zalo';
  onResent: (c: SendOtpResult) => void;
  onChangePhone: () => void;
  onSuccess: () => void;
}) {
  const verify = useVerifyOtp();
  const resend = useSendOtp();
  const [code, setCode] = useState('');
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const resendIn = Math.max(0, Math.ceil((sentAt + challenge.resendInSec * 1000 - now) / 1000));
  const expired = now > sentAt + challenge.expiresInSec * 1000;
  const verifyError = verify.error instanceof ApiError ? verify.error : null;
  const mustResend = verifyError?.code === 'OTP_LOCKED' || verifyError?.code === 'OTP_EXPIRED' || expired;

  const submit = (value: string) => {
    if (value.length !== 6 || verify.isPending) return;
    verify.mutate({ challengeId: challenge.challengeId, code: value }, { onSuccess, onError: () => setCode('') });
  };

  const doResend = () => {
    verify.reset();
    setCode('');
    resend.mutate(
      { phone },
      {
        onSuccess: (next) => {
          setSentAt(Date.now());
          onResent(next);
        },
      },
    );
  };

  return (
    <div>
      <p className="text-center text-[0.95rem] text-muted">
        Nhập mã 6 số đã gửi qua Zalo tới
        <br />
        <span className="text-lg font-bold text-text">{challenge.phoneMasked}</span>
      </p>

      {challenge.devCode && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm">
          <FlaskConical className="size-5 shrink-0 text-amber-300" />
          <span>
            Chế độ thử nghiệm (chưa kết nối Zalo OA). Mã của bạn: <b className="tracking-[0.2em]">{challenge.devCode}</b>
          </span>
        </div>
      )}

      <div className="mt-5">
        <OtpInput value={code} onChange={setCode} onComplete={submit} invalid={!!verify.error} disabled={verify.isPending || mustResend} />
      </div>

      <div className="mt-3 min-h-5 text-center text-sm">
        {verify.isPending && <span className="text-muted">Đang kiểm tra…</span>}
        {verify.error && <span className="text-danger">{errorMessage(verify.error)}</span>}
        {!verify.error && expired && <span className="text-danger">Mã đã hết hạn. Vui lòng gửi lại mã mới.</span>}
        {resend.error && <span className="text-danger">{errorMessage(resend.error)}</span>}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        {!mustResend && (
          <Button variant="primary" className="w-full" disabled={code.length !== 6 || verify.isPending} onClick={() => submit(code)}>
            Xác nhận
          </Button>
        )}
        <Button variant={mustResend ? 'primary' : 'ghost'} className={cn(mustResend && 'w-full')} disabled={resendIn > 0 || resend.isPending} onClick={doResend}>
          {resend.isPending ? 'Đang gửi lại…' : resendIn > 0 ? `Gửi lại mã sau ${resendIn}s` : 'Gửi lại mã'}
        </Button>
        <button type="button" onClick={onChangePhone} className="text-sm font-semibold text-muted transition hover:text-text">
          Đổi số điện thoại
        </button>
      </div>
      {mode === 'zalo' && (
        <p className="mt-4 text-center text-xs leading-relaxed text-faint">Không thấy tin nhắn? Mở ứng dụng Zalo và kiểm tra mục tin nhắn từ tài khoản doanh nghiệp.</p>
      )}
    </div>
  );
}

import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { GoogleSignInButton } from './GoogleSignInButton';

/** Google chỉ cho đăng nhập trên localhost hoặc tên miền HTTPS (không chấp nhận http://192.168.x.x). */
function isGoogleCompatibleOrigin(): boolean {
  const { protocol, hostname } = window.location;
  return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Khu vực đăng nhập Google:
 *  - Đã cấu hình & địa chỉ hợp lệ → nút chính thức của Google.
 *  - Chưa cấu hình hoặc đang mở qua IP LAN → nút mờ + giải thích cách bật.
 */
export function GoogleLoginSection({ clientId, onSuccess }: { clientId: string | null; onSuccess: () => void }) {
  if (clientId && isGoogleCompatibleOrigin()) {
    return <GoogleSignInButton clientId={clientId} onSuccess={onSuccess} />;
  }

  const reason: ReactNode = !clientId ? (
    import.meta.env.DEV ? (
      <>
        Chưa có Google Client ID. Chạy <code className="rounded bg-white/10 px-1">npm run setup:google -- &lt;CLIENT_ID&gt;</code> rồi khởi động lại server (xem README).
      </>
    ) : (
      'Đăng nhập bằng Google chưa được bật trên máy chủ này.'
    )
  ) : (
    <>
      Google không cho đăng nhập khi mở app qua địa chỉ IP ({window.location.host}). Trên máy tính hãy mở <b>localhost</b>; trên điện thoại cần mở bằng
      tên miền <b>HTTPS</b>.
    </>
  );

  return (
    <div>
      <button
        type="button"
        disabled
        className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-full bg-[#131314] text-[0.95rem] font-medium text-white/50 ring-1 ring-white/15"
      >
        <GoogleG className="size-5 opacity-60" />
        Tiếp tục với Google
      </button>
      <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>{reason}</span>
      </p>
    </div>
  );
}

/** Chữ "G" bốn màu dạng đơn giản (nhận diện, không phải logo gốc). */
export function GoogleG({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      <span className="flex size-full items-center justify-center rounded-full bg-white text-[0.8em] leading-none font-extrabold">
        <span className="bg-[conic-gradient(from_200deg,#ea4335_0_25%,#fbbc05_0_45%,#34a853_0_70%,#4285f4_0)] bg-clip-text text-transparent">G</span>
      </span>
    </span>
  );
}

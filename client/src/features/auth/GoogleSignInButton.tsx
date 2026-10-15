import { useEffect, useRef, useState } from 'react';
import { useGoogleLogin } from '../../api/auth';
import { isStandalone } from '../../hooks/usePwaInstall';
import { errorMessage } from '../../lib/api';
import { getGuestId } from '../../lib/guest';
import { loadGoogleIdentity } from './google-identity';

/**
 * Nút "Tiếp tục với Google" chính thức của Google.
 *  - Trình duyệt thường: chế độ popup → nhận ID token → gửi lên /api/auth/google.
 *  - App PWA đã cài (popup không hoạt động): chế độ chuyển trang → Google POST thẳng về server.
 */
export function GoogleSignInButton({ clientId, onSuccess }: { clientId: string; onSuccess: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const login = useGoogleLogin();
  const loginRef = useRef(login);
  loginRef.current = login;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const redirectMode = isStandalone();

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then((google) => {
        const el = containerRef.current;
        if (cancelled || !el) return;
        if (redirectMode) {
          // Server đọc cookie này để chuyển dữ liệu khách sang tài khoản sau khi Google chuyển trang về.
          const secure = window.location.protocol === 'https:';
          document.cookie = `nocturne_guest=${getGuestId()}; Path=/; Max-Age=600; ${secure ? 'SameSite=None; Secure' : 'SameSite=Lax'}`;
        }
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: redirectMode ? 'redirect' : 'popup',
          login_uri: redirectMode ? `${window.location.origin}/api/auth/google/redirect` : undefined,
          callback: redirectMode
            ? undefined
            : ({ credential }) => loginRef.current.mutate({ credential }, { onSuccess: () => onSuccessRef.current() }),
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          itp_support: true,
        });
        el.innerHTML = '';
        google.accounts.id.renderButton(el, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          locale: 'vi',
          width: Math.min(400, Math.max(240, el.clientWidth)),
        });
        setRendered(true);
      })
      .catch(() => !cancelled && setLoadError('Không tải được nút đăng nhập Google. Kiểm tra kết nối mạng rồi thử lại.'));
    return () => {
      cancelled = true;
    };
  }, [clientId, redirectMode]);

  return (
    <div className="relative">
      {!rendered && !loadError && (
        <div className="absolute inset-x-0 top-0 flex h-11 animate-pulse items-center justify-center rounded-full bg-white/8 text-sm text-muted">
          Đang tải Google…
        </div>
      )}
      <div ref={containerRef} className="flex min-h-11 w-full justify-center [color-scheme:light]" aria-busy={login.isPending} />
      {login.isPending && <p className="mt-2 text-center text-sm text-muted">Đang đăng nhập…</p>}
      {(loadError || login.error) && <p className="mt-2 text-center text-sm text-danger">{loadError ?? errorMessage(login.error)}</p>}
    </div>
  );
}

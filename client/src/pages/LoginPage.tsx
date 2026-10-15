import { Check } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuthConfig } from '../api/auth';
import { useMe } from '../api/me';
import { LogoMark } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { ErrorState, Skeleton } from '../components/ui/States';
import { GoogleLoginSection } from '../features/auth/GoogleLoginSection';
import { ZaloBadge, ZaloLogin } from '../features/auth/ZaloLogin';
import { rememberLoginRedirect } from '../features/auth/login-redirect';

/** Trang đăng nhập / liên kết tài khoản bằng Google hoặc số điện thoại Zalo. */
export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: config, isLoading, error, refetch } = useAuthConfig();
  const { data: me } = useMe();
  const from = params.get('from') || '/profile';
  const linking = me?.kind === 'member';

  // Ghi nhớ trang cần quay lại (dùng khi Google chuyển trang về /login/callback).
  useEffect(() => rememberLoginRedirect(from), [from]);
  const done = () => navigate(from, { replace: true });

  return (
    <div className="mx-auto max-w-md animate-fade-in py-2 sm:py-8">
      <section className="glass rounded-panel px-5 py-8 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-[#1d3566] via-[#43297a] to-[#b13f7e] shadow-[0_18px_40px_-18px_rgb(177_63_126/0.8)]">
            <LogoMark className="size-9 text-white" />
          </span>
          <h1 className="mt-5 text-[1.75rem] font-extrabold tracking-tight">{linking ? 'Liên kết tài khoản' : 'Đăng nhập Nocturne'}</h1>
          <p className="mt-2 text-[0.95rem] text-muted">
            {linking
              ? 'Thêm cách đăng nhập khác cho tài khoản của bạn.'
              : 'Giữ playlist, bài hát đã thích và lịch sử nghe — dùng được trên mọi thiết bị.'}
          </p>
        </div>

        {isLoading && (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-11 rounded-full" />
            <Skeleton className="h-14" />
          </div>
        )}
        {error && <ErrorState error={error} onRetry={() => void refetch()} />}

        {config && (
          <div className="mt-8">
            <GoogleLoginSection clientId={config.google.enabled ? config.google.clientId : null} onSuccess={done} />

            {config.zalo.enabled && (
              <>
                <div className="my-6 flex items-center gap-3 text-xs font-semibold tracking-wider text-faint uppercase">
                  <span className="h-px flex-1 bg-line" />
                  hoặc dùng
                  <ZaloBadge />
                  <span className="h-px flex-1 bg-line" />
                </div>
                <ZaloLogin mode={config.zalo.mode} onSuccess={done} />
              </>
            )}
          </div>
        )}
      </section>

      {!linking && (
        <ul className="mt-6 space-y-2 px-2 text-sm text-muted">
          {['Playlist và bài hát đã thích trên máy này sẽ được chuyển vào tài khoản.', 'Không cần mật khẩu — đăng nhập bằng Google hoặc mã gửi qua Zalo.'].map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-accent" />
              {t}
            </li>
          ))}
        </ul>
      )}
      {linking && (
        <div className="mt-6 text-center">
          <Link to="/profile">
            <Button variant="ghost">Quay lại hồ sơ</Button>
          </Link>
        </div>
      )}
    </div>
  );
}


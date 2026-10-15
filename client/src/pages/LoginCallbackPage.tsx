import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { completeLogin } from '../api/auth';
import { Button } from '../components/ui/Button';
import { EmptyState, PageSkeleton } from '../components/ui/States';
import { consumeLoginRedirect } from '../features/auth/login-redirect';

const ERRORS: Record<string, string> = {
  csrf: 'Phiên đăng nhập không hợp lệ (có thể do trình duyệt chặn cookie). Vui lòng thử lại.',
  google: 'Google chưa xác nhận được tài khoản của bạn. Vui lòng thử lại.',
};

/** Google chuyển trang về đây (chế độ PWA đã cài): `#session=...` hoặc `#error=...`. */
export default function LoginCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    // Xoá mã phiên khỏi thanh địa chỉ / lịch sử ngay lập tức.
    window.history.replaceState(null, '', window.location.pathname);
    const token = params.get('session');
    if (!token) {
      setError(ERRORS[params.get('error') ?? ''] ?? 'Đăng nhập không thành công. Vui lòng thử lại.');
      return;
    }
    void completeLogin(token, { isNewUser: params.get('new') === '1', mergedGuestData: params.get('merged') === '1' }).then(() =>
      navigate(consumeLoginRedirect(), { replace: true }),
    );
  }, [navigate]);

  if (!error) return <PageSkeleton />;
  return (
    <EmptyState
      icon={<TriangleAlert className="size-7 text-danger" />}
      title="Chưa đăng nhập được"
      description={error}
      action={
        <Link to="/login" replace>
          <Button variant="primary">Thử lại</Button>
        </Link>
      }
      className="py-24"
    />
  );
}

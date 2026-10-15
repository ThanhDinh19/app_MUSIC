import { RefreshCw, WifiOff } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useOnline } from '../../hooks/useOnline';
import { Button } from '../ui/Button';

/** Thông báo mất mạng. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-[calc(var(--safe-top)+0.5rem)] z-[90] flex justify-center px-4">
      <div className="glass-strong flex animate-slide-up items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
        <WifiOff className="size-4 text-danger" />
        Bạn đang offline — hiển thị dữ liệu đã lưu
      </div>
    </div>
  );
}

/** Khi có phiên bản PWA mới: hỏi người dùng trước khi tải lại (không cắt ngang bài đang nghe). */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Kiểm tra bản mới mỗi giờ khi app mở lâu.
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;
  return (
    <div className="fixed inset-x-0 top-[calc(var(--safe-top)+0.75rem)] z-[90] flex justify-center px-4">
      <div className="glass-strong flex w-full max-w-md animate-slide-up items-center gap-3 rounded-2xl p-3 pl-4">
        <RefreshCw className="size-5 shrink-0 text-accent" />
        <span className="flex-1 text-sm font-medium">Đã có phiên bản mới của Nocturne.</span>
        <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
          Để sau
        </Button>
        <Button size="sm" variant="primary" onClick={() => void updateServiceWorker(true)}>
          Cập nhật
        </Button>
      </div>
    </div>
  );
}

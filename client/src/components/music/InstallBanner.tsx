import { Download, Share, X } from 'lucide-react';
import { useState } from 'react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { storage } from '../../lib/storage';
import { LogoMark } from '../layout/Logo';
import { Button, IconButton } from '../ui/Button';

const DISMISS_KEY = 'nocturne:install-dismissed';

/** Gợi ý cài ứng dụng lên màn hình chính (Android: nút cài; iPhone: hướng dẫn). */
export function InstallBanner() {
  const { canPrompt, needsIosHint, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => storage.get(DISMISS_KEY, false));
  if (dismissed || (!canPrompt && !needsIosHint)) return null;

  const dismiss = () => {
    storage.set(DISMISS_KEY, true);
    setDismissed(true);
  };

  return (
    <div className="glass mb-7 flex items-center gap-4 rounded-[1.5rem] p-4 animate-slide-up">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d3566] via-[#43297a] to-[#b13f7e]">
        <LogoMark className="size-7 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-bold">Cài Nocturne lên điện thoại</div>
        <p className="text-sm text-muted">
          {canPrompt ? (
            'Mở nhanh từ màn hình chính, nghe nhạc toàn màn hình như ứng dụng thật.'
          ) : (
            <>
              Nhấn <Share className="mx-0.5 inline size-4 -translate-y-0.5" /> <b>Chia sẻ</b> rồi chọn <b>Thêm vào MH chính</b>.
            </>
          )}
        </p>
      </div>
      {canPrompt && (
        <Button variant="primary" size="sm" icon={<Download className="size-4" />} onClick={() => void promptInstall()}>
          Cài đặt
        </Button>
      )}
      <IconButton label="Ẩn gợi ý" size="sm" onClick={dismiss}>
        <X className="size-4" />
      </IconButton>
    </div>
  );
}

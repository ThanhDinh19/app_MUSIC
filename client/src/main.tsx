import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { queryClient } from './api/query-client';
import { router } from './app/router';
import { toastError } from './features/ui/toast.store';
import { capturePwaInstallPrompt } from './hooks/usePwaInstall';
import { onSessionChange } from './lib/session';
import './styles/index.css';

capturePwaInstallPrompt();

// Phiên đăng nhập hết hạn (server trả 401) → báo người dùng và tải lại dữ liệu ở chế độ khách.
onSessionChange((reason) => {
  if (reason !== 'expired') return;
  queryClient.removeQueries({ queryKey: ['me'] });
  void queryClient.invalidateQueries();
  toastError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

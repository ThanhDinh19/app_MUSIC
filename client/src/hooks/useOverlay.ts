import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Mở/đóng một lớp phủ (vd. trình phát toàn màn hình) bằng tham số URL `?name=1`.
 * Nhờ vậy nút Back của điện thoại sẽ đóng lớp phủ thay vì rời trang.
 */
export function useOverlay(name: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const isOpen = new URLSearchParams(location.search).get(name) === '1';

  const open = useCallback(() => {
    const params = new URLSearchParams(location.search);
    if (params.get(name) === '1') return;
    params.set(name, '1');
    navigate({ pathname: location.pathname, search: params.toString() }, { state: { overlay: name }, preventScrollReset: true });
  }, [location.pathname, location.search, name, navigate]);

  const close = useCallback(() => {
    if ((location.state as { overlay?: string } | null)?.overlay === name) {
      navigate(-1);
      return;
    }
    const params = new URLSearchParams(location.search);
    params.delete(name);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true, preventScrollReset: true });
  }, [location.pathname, location.search, location.state, name, navigate]);

  return { isOpen, open, close };
}

import type { AuthConfig, AuthResult, GoogleLoginInput, SendOtpInput, SendOtpResult, VerifyOtpInput } from '@nocturne/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '../features/ui/toast.store';
import { api } from '../lib/api';
import { resetGuestId } from '../lib/guest';
import { clearSessionToken, getSessionToken, setSessionToken } from '../lib/session';
import { qk, queryClient } from './query-client';

export const useAuthConfig = () =>
  useQuery({ queryKey: ['auth', 'config'], queryFn: () => api.get<AuthConfig>('/auth/config'), staleTime: 10 * 60_000 });

/** Xoá dữ liệu API đã cache cho offline (tránh lộ dữ liệu của người dùng trước trên cùng thiết bị). */
async function clearOfflineApiCache(): Promise<void> {
  try {
    if ('caches' in window) await caches.delete('nocturne-api');
  } catch {
    /* bỏ qua */
  }
}

/**
 * Hoàn tất đăng nhập: lưu mã phiên, tạo mã khách mới (cho lần đăng xuất sau),
 * rồi tải lại mọi dữ liệu theo tài khoản.
 */
export async function completeLogin(
  token: string,
  result?: Pick<AuthResult, 'mergedGuestData' | 'isNewUser'> & { user?: AuthResult['user'] },
): Promise<void> {
  setSessionToken(token);
  resetGuestId();
  await clearOfflineApiCache();
  if (result?.user) queryClient.setQueryData(qk.me, result.user);
  await queryClient.invalidateQueries();
  const name = result?.user?.displayName;
  toast(
    result?.mergedGuestData
      ? 'Đã đăng nhập — thư viện trên máy này đã được chuyển vào tài khoản'
      : result?.isNewUser
        ? `Chào mừng ${name ?? 'bạn'} đến với Nocturne!`
        : `Chào mừng ${name ?? 'bạn'} quay lại!`,
  );
}

export async function logout(): Promise<void> {
  if (getSessionToken()) {
    await api.post<void>('/auth/logout').catch(() => undefined);
  }
  clearSessionToken('logout');
  await clearOfflineApiCache();
  queryClient.removeQueries({ queryKey: ['me'] });
  await queryClient.invalidateQueries();
  toast('Đã đăng xuất');
}

export const useSendOtp = () => useMutation({ mutationFn: (input: SendOtpInput) => api.post<SendOtpResult>('/auth/otp/send', input) });

export const useVerifyOtp = () =>
  useMutation({
    mutationFn: (input: VerifyOtpInput) => api.post<AuthResult>('/auth/otp/verify', input),
    onSuccess: (result) => completeLogin(result.token, result),
  });

export const useGoogleLogin = () =>
  useMutation({
    mutationFn: (input: GoogleLoginInput) => api.post<AuthResult>('/auth/google', input),
    onSuccess: (result) => completeLogin(result.token, result),
  });

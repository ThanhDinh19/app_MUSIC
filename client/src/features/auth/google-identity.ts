/** Tải thư viện Google Identity Services (nút "Sign in with Google") khi cần. */

export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleIdConfig {
  client_id: string;
  ux_mode: 'popup' | 'redirect';
  login_uri?: string;
  callback?: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  itp_support?: boolean;
}

export interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  logo_alignment?: 'left' | 'center';
  locale?: string;
  width?: number;
}

export interface GoogleIdentity {
  accounts: {
    id: {
      initialize(config: GoogleIdConfig): void;
      renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
      disableAutoSelect(): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let loading: Promise<GoogleIdentity> | null = null;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => (window.google?.accounts?.id ? resolve(window.google) : reject(new Error('Google Identity không khả dụng')));
    script.onerror = () => {
      loading = null;
      reject(new Error('Không tải được Google Identity'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** Tìm thư mục gốc của package server (chạy đúng cả khi dùng tsx từ src/ lẫn bản build trong dist/). */
function findServerRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const pkg = join(dir, 'package.json');
    if (existsSync(pkg)) {
      const { name } = JSON.parse(readFileSync(pkg, 'utf8')) as { name?: string };
      if (name === '@nocturne/server') return dir;
    }
    dir = dirname(dir);
  }
  return process.cwd();
}

const serverRoot = findServerRoot();
const envFile = join(serverRoot, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATA_PROVIDER: z.enum(['json', 'mssql']).default('json'),
  DATA_DIR: z.string().default('storage/data'),
  SEED_DIR: z.string().default('storage/seed'),
  MEDIA_DIR: z.string().default('storage/media'),
  SECRETS_DIR: z.string().default('storage/secrets'),
  MEDIA_BASE_URL: z.string().default('/media'),
  CLIENT_DIST_DIR: z.string().default('../client/dist'),
  CORS_ORIGINS: z.string().default(''),
  MSSQL_CONNECTION_STRING: z.string().optional(),

  // Đăng nhập
  AUTH_SECRET: z.string().optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(60),
  GOOGLE_CLIENT_ID: z.string().optional(),
  /** Nguồn khoá công khai để kiểm chữ ký ID token — chỉ đổi khi kiểm thử. */
  GOOGLE_JWKS_URL: z.string().url().default('https://www.googleapis.com/oauth2/v3/certs'),
  OTP_PROVIDER: z.enum(['console', 'zalo']).default('console'),
  ZALO_APP_ID: z.string().optional(),
  ZALO_APP_SECRET: z.string().optional(),
  ZALO_OA_REFRESH_TOKEN: z.string().optional(),
  ZALO_ZNS_TEMPLATE_ID: z.string().optional(),
  ZALO_ZNS_OTP_PARAM: z.string().default('otp'),
  ZALO_ZNS_MODE: z.enum(['production', 'development']).default('production'),
  ZALO_OAUTH_BASE: z.string().default('https://oauth.zaloapp.com'),
  ZALO_ZNS_BASE: z.string().default('https://business.openapi.zalo.me'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Cấu hình môi trường không hợp lệ:');
  for (const issue of parsed.error.issues) console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const env = parsed.data;
const fromRoot = (p: string) => (isAbsolute(p) ? p : resolve(serverRoot, p));
const blank = (v?: string) => (v && v.trim() ? v.trim() : undefined);

if (!env.AUTH_SECRET) {
  const msg = 'AUTH_SECRET chưa được đặt — đang dùng khoá tạm, mã OTP chưa dùng sẽ mất hiệu lực khi khởi động lại.';
  if (env.NODE_ENV === 'production') console.warn(`⚠️  ${msg} Hãy đặt AUTH_SECRET trong server/.env.`);
}

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  host: env.HOST,
  dataProvider: env.DATA_PROVIDER,
  dataDir: fromRoot(env.DATA_DIR),
  seedDir: fromRoot(env.SEED_DIR),
  mediaDir: fromRoot(env.MEDIA_DIR),
  /** Nơi lưu token của dịch vụ ngoài (Zalo OA) — tách khỏi dataDir để `data:reset` không xoá mất. */
  secretsDir: fromRoot(env.SECRETS_DIR),
  mediaBaseUrl: env.MEDIA_BASE_URL.replace(/\/+$/, ''),
  clientDistDir: fromRoot(env.CLIENT_DIST_DIR),
  corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  mssqlConnectionString: env.MSSQL_CONNECTION_STRING,
  auth: {
    secret: env.AUTH_SECRET ?? randomBytes(32).toString('hex'),
    sessionTtlMs: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    googleClientId: blank(env.GOOGLE_CLIENT_ID),
    googleJwksUrl: env.GOOGLE_JWKS_URL,
    otpProvider: env.OTP_PROVIDER,
    zalo: {
      appId: blank(env.ZALO_APP_ID),
      appSecret: blank(env.ZALO_APP_SECRET),
      initialRefreshToken: blank(env.ZALO_OA_REFRESH_TOKEN),
      templateId: blank(env.ZALO_ZNS_TEMPLATE_ID),
      otpParam: env.ZALO_ZNS_OTP_PARAM,
      mode: env.ZALO_ZNS_MODE,
      oauthBase: env.ZALO_OAUTH_BASE.replace(/\/+$/, ''),
      znsBase: env.ZALO_ZNS_BASE.replace(/\/+$/, ''),
    },
  },
} as const;

export type AppConfig = typeof config;

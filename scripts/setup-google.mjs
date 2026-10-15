/**
 * Bật đăng nhập Google: ghi GOOGLE_CLIENT_ID vào server/.env.
 *
 *   npm run setup:google -- 1234567890-abc.apps.googleusercontent.com
 *
 * - Chưa có server/.env → tạo từ server/.env.example và sinh AUTH_SECRET ngẫu nhiên.
 * - Đã có → chỉ cập nhật dòng GOOGLE_CLIENT_ID (giữ nguyên các cấu hình khác).
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, 'server/.env');
const EXAMPLE_FILE = join(ROOT, 'server/.env.example');

const clientId = (process.argv[2] ?? '').trim();
if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
  console.error('\n❌ Client ID không hợp lệ.');
  console.error('   Cách dùng: npm run setup:google -- <CLIENT_ID>');
  console.error('   Client ID có dạng: 1234567890-abcdefg.apps.googleusercontent.com\n');
  process.exit(1);
}

/** Đặt giá trị một biến trong nội dung .env (thay dòng cũ hoặc thêm mới). */
function setVar(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  return pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
}

const created = !existsSync(ENV_FILE);
let env = readFileSync(created ? EXAMPLE_FILE : ENV_FILE, 'utf8');
if (!/^AUTH_SECRET=\S+/m.test(env)) env = setVar(env, 'AUTH_SECRET', randomBytes(32).toString('hex'));
env = setVar(env, 'GOOGLE_CLIENT_ID', clientId);
writeFileSync(ENV_FILE, env, 'utf8');

console.log(`\n✅ Đã ${created ? 'tạo' : 'cập nhật'} server/.env với GOOGLE_CLIENT_ID=${clientId}\n`);
console.log('Kiểm tra lại trên Google Cloud Console (APIs & Services → Credentials → Client ID của bạn):');
console.log('  • Authorized JavaScript origins:');
console.log('      http://localhost:5173      (npm run dev)');
console.log('      http://localhost:4000      (npm start)');
console.log('      https://<tên-miền-của-bạn> (khi dùng trên điện thoại)');
console.log('  • Authorized redirect URIs (cho app PWA đã cài):');
console.log('      https://<tên-miền-của-bạn>/api/auth/google/redirect');
console.log('  • Google Auth Platform → Audience: nếu đang ở chế độ "Testing", chỉ các email trong "Test users" đăng nhập được.');
console.log('    Bấm "Publish app" để mọi tài khoản Google đều đăng nhập được (chỉ dùng email/tên/ảnh nên không cần xét duyệt).\n');
console.log('➡️  Khởi động lại server (npm run dev) để áp dụng.\n');

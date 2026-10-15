/**
 * Tạo gói cài đặt đã build sẵn: release/nocturne-release.tgz
 *
 *   npm run release                 (build rồi đóng gói)
 *   npm run release -- --skip-build (dùng bản build hiện có)
 *
 * Trên server Linux:  tar -xzf nocturne-release.tgz && bash nocturne/install.sh
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'release');
const STAGE = join(OUT_DIR, 'nocturne');
const ARCHIVE = join(OUT_DIR, 'nocturne-release.tgz');

if (!process.argv.includes('--skip-build')) {
  console.log('• Build client + server...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
}

for (const required of ['client/dist/index.html', 'server/dist/index.js']) {
  if (!existsSync(join(ROOT, required))) throw new Error(`Thiếu ${required} — hãy chạy npm run build.`);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });

const copy = (path) => cpSync(join(ROOT, path), join(STAGE, path), { recursive: true });
[
  'package.json',
  'package-lock.json',
  'ecosystem.config.cjs',
  'shared/package.json',
  'client/package.json',
  'client/dist',
  'server/package.json',
  'server/.env.example',
  'server/dist',
  'server/storage/seed',
  'server/storage/media',
].forEach(copy);

// Script cài đặt: bắt buộc xuống dòng kiểu Unix (LF).
writeFileSync(join(STAGE, 'install.sh'), readFileSync(join(ROOT, 'deploy/install.sh'), 'utf8').replace(/\r\n/g, '\n'));

console.log('• Đóng gói...');
// Chạy trong thư mục release với đường dẫn tương đối (tar của Git Bash hiểu nhầm "D:\..." là máy từ xa).
execSync('tar -czf nocturne-release.tgz nocturne', { cwd: OUT_DIR, stdio: 'inherit' });
rmSync(STAGE, { recursive: true, force: true });

const mb = (statSync(ARCHIVE).size / 1024 / 1024).toFixed(1);
console.log(`\n✅ ${ARCHIVE} (${mb} MB)`);
console.log('   Trên server: tar -xzf nocturne-release.tgz && bash nocturne/install.sh\n');

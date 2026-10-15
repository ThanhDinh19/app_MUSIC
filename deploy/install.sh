#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Cài đặt / cập nhật Nocturne trên server Linux và chạy bằng PM2 (mặc định cổng 8080).
#
#   tar -xzf nocturne-release.tgz && bash nocturne/install.sh
#   PORT=9000 bash nocturne/install.sh          # chọn cổng khác
#
# - Dùng Node.js 22 RIÊNG trong nocturne/.runtime → không đụng tới Node / app khác đang chạy trên server.
# - Chạy lại script này để cập nhật: dữ liệu (server/storage/data) và cấu hình (server/.env) được giữ nguyên.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="$APP_DIR/.runtime"
NODE_DIR="$RUNTIME/node"
APP_NAME="music-app"
cd "$APP_DIR"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m❌ %s\033[0m\n' "$*"; exit 1; }

# Cổng: ưu tiên biến PORT, sau đó cấu hình đã lưu trong server/.env, mặc định 8080.
if [ -z "${PORT:-}" ] && [ -f server/.env ]; then
  PORT="$(grep -E '^PORT=' server/.env | tail -n1 | cut -d= -f2 | tr -d '[:space:]' || true)"
fi
PORT="${PORT:-8080}"

command -v curl >/dev/null || fail "Server cần có curl (sudo apt-get install -y curl)."

# ── 1. Node.js 22 riêng cho Nocturne ─────────────────────────────────────────
say "Chuẩn bị Node.js 22 (riêng cho Nocturne)"
if [ ! -x "$NODE_DIR/bin/node" ]; then
  case "$(uname -m)" in
    x86_64 | amd64) ARCH=x64 ;;
    aarch64 | arm64) ARCH=arm64 ;;
    *) fail "Kiến trúc CPU chưa hỗ trợ: $(uname -m)" ;;
  esac
  BASE="https://nodejs.org/dist/latest-v22.x"
  SUMS="$(curl -fsSL "$BASE/SHASUMS256.txt")" || fail "Không tải được danh sách Node.js (kiểm tra mạng của server)."
  FILE="$(printf '%s\n' "$SUMS" | grep -oE "node-v22\.[0-9]+\.[0-9]+-linux-$ARCH\.tar\.gz$" | head -n1)"
  [ -n "$FILE" ] || fail "Không tìm thấy bản Node.js 22 cho linux-$ARCH."
  TMP="$(mktemp -d)"
  curl -fsSL "$BASE/$FILE" -o "$TMP/$FILE" || fail "Tải $FILE thất bại."
  (cd "$TMP" && printf '%s\n' "$SUMS" | grep " $FILE\$" | sha256sum -c - >/dev/null) || fail "Sai checksum khi tải Node.js."
  mkdir -p "$NODE_DIR"
  tar -xzf "$TMP/$FILE" -C "$NODE_DIR" --strip-components=1
  rm -rf "$TMP"
fi
export PATH="$NODE_DIR/bin:$PATH"
export NOCTURNE_NODE="$NODE_DIR/bin/node"
export NOCTURNE_PORT="$PORT"
echo "    node $(node -v), npm $(npm -v)"

# ── 2. Thư viện production ───────────────────────────────────────────────────
say "Cài thư viện (npm ci)"
npm ci --omit=dev --workspace @nocturne/server --no-audit --no-fund --loglevel=error

# ── 3. Cấu hình (chỉ tạo lần đầu) ────────────────────────────────────────────
if [ ! -f server/.env ]; then
  say "Tạo cấu hình server/.env"
  SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  cat > server/.env <<EOF
NODE_ENV=production
HOST=0.0.0.0
PORT=$PORT
AUTH_SECRET=$SECRET
# Bản demo: mã OTP đăng nhập Zalo hiện ngay trên màn hình.
# Khi có Zalo Official Account thật: đặt OTP_PROVIDER=zalo + các biến ZALO_* (xem server/.env.example) và xoá dòng dưới.
OTP_SHOW_CODE=true
# Đăng nhập Google (cần tên miền HTTPS): GOOGLE_CLIENT_ID=...
EOF
  chmod 600 server/.env
else
  echo "    Giữ nguyên server/.env hiện có"
fi

# ── 4. PM2 ───────────────────────────────────────────────────────────────────
say "Khởi động bằng PM2 (cổng $PORT)"
if command -v pm2 >/dev/null 2>&1; then
  PM2="$(command -v pm2)"
else
  npm install --prefix "$RUNTIME/pm2" pm2@6 --no-audit --no-fund --loglevel=error
  PM2="$RUNTIME/pm2/node_modules/.bin/pm2"
fi

# Cổng đang bị chương trình khác chiếm (không phải Nocturne) → dừng lại thay vì làm hỏng app khác.
if ! "$PM2" describe "$APP_NAME" >/dev/null 2>&1; then
  if (command -v ss >/dev/null && ss -ltn 2>/dev/null | grep -qE "[:.]$PORT[[:space:]]") ; then
    fail "Cổng $PORT đang được chương trình khác sử dụng. Chạy lại với cổng khác, ví dụ: PORT=8081 bash $0"
  fi
fi

"$PM2" startOrReload ecosystem.config.cjs --update-env
"$PM2" save >/dev/null

# Lệnh tắt ~/nocturne/pm2 — luôn chạy PM2 với đúng Node.js của Nocturne (dùng được trong mọi phiên SSH mới).
cat > "$APP_DIR/pm2" <<EOF
#!/usr/bin/env bash
export PATH="$NODE_DIR/bin:\$PATH"
exec "$PM2" "\$@"
EOF
chmod +x "$APP_DIR/pm2"

# Tự chạy lại khi server khởi động lại (cần sudo không mật khẩu — mặc định trên Google Cloud).
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ] && sudo -n true 2>/dev/null; then
  if ! systemctl is-enabled "pm2-$USER" >/dev/null 2>&1; then
    sudo env PATH="$PATH" "$PM2" startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 \
      && echo "    Đã bật tự khởi động cùng server" \
      || echo "    (Chưa bật được tự khởi động — có thể chạy: pm2 startup)"
  fi
fi

# Tường lửa bên trong máy (nếu đang bật ufw)
if command -v ufw >/dev/null 2>&1 && sudo -n ufw status 2>/dev/null | grep -q "Status: active"; then
  sudo -n ufw allow "$PORT/tcp" >/dev/null && echo "    Đã mở cổng $PORT trên ufw"
fi

# ── 5. Kiểm tra ──────────────────────────────────────────────────────────────
say "Kiểm tra"
for _ in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break
  sleep 1
done
if ! curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
  "$APP_DIR/pm2" logs "$APP_NAME" --lines 40 --nostream || true
  fail "App chưa chạy được — xem log phía trên."
fi
IP="$(curl -fsS -m 2 -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null \
  || hostname -I 2>/dev/null | awk '{print $1}')"

printf '\n\033[1;32m✅ Nocturne đang chạy: http://%s:%s\033[0m\n' "${IP:-<IP-server>}" "$PORT"
cat <<EOF

Lệnh hữu ích:
  $APP_DIR/pm2 logs $APP_NAME      # xem log (mã OTP demo cũng in ở đây)
  $APP_DIR/pm2 restart $APP_NAME   # khởi động lại
  $APP_DIR/pm2 status              # trạng thái
  nano $APP_DIR/server/.env        # sửa cấu hình rồi restart
Nếu máy khác không mở được trang: thêm firewall rule cho phép TCP $PORT trên Google Cloud (VPC network → Firewall).
EOF

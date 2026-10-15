# 🎧 Nocturne — ứng dụng nghe nhạc PWA

Ứng dụng nghe nhạc trên web, thiết kế ưu tiên điện thoại và **cài được lên màn hình chính như một app** (PWA).
Giao diện kính mờ tông xanh đêm – tím – hồng, phân loại nhạc theo **tâm trạng**.

| Thành phần       | Công nghệ                                                       |
| ---------------- | --------------------------------------------------------------- |
| Frontend         | React 19 + TypeScript + Vite, React Router, Tailwind CSS v4      |
| State            | Zustand (trình phát nhạc), TanStack Query (dữ liệu từ API)       |
| PWA              | vite-plugin-pwa (Workbox): cài đặt, offline, cập nhật phiên bản  |
| Phát nhạc        | HTML Audio API + Media Session (điều khiển từ màn hình khoá)     |
| Backend          | Node.js + Express 5 + TypeScript, kiểm tra dữ liệu bằng Zod      |
| Lưu trữ          | File JSON (hiện tại) → Microsoft SQL Server (đã chừa sẵn)        |

## Chạy thử

Yêu cầu: **Node.js 22** trở lên.

```bash
npm install
npm run dev
```

- Giao diện: http://localhost:5173 (Vite, tự chuyển `/api` và `/media` sang server)
- API: http://localhost:4000/api/health

Bản production (một server phục vụ cả API lẫn giao diện):

```bash
npm run build
npm start            # http://localhost:4000
```

## Dùng trên điện thoại

1. Máy tính và điện thoại dùng chung Wi-Fi. Khi chạy, terminal in ra địa chỉ LAN, ví dụ `http://192.168.1.10:5173`.
2. Mở địa chỉ đó trên điện thoại là nghe được ngay.
3. **Cài thành app**: trình duyệt chỉ cho cài PWA khi trang chạy qua **HTTPS** (hoặc `localhost`). Có thể:
   - Tạo đường hầm HTTPS tạm thời: `npx cloudflared tunnel --url http://localhost:4000` (sau `npm run build && npm start`) rồi mở link `https://...trycloudflare.com`.
   - Hoặc triển khai lên máy chủ/hosting có HTTPS.
   - Android (Chrome): bấm **Cài đặt** ở trang chủ / trang Hồ sơ. iPhone (Safari): **Chia sẻ → Thêm vào MH chính**.

## Tính năng

**Giai đoạn 1 — Demo cốt lõi** ✅
- Trang chủ (album nổi bật, thịnh hành, mới phát hành, playlist, nghệ sĩ), Khám phá (tâm trạng, thể loại), Tìm kiếm (không dấu, kết quả hàng đầu), Thư viện.
- Trang album, nghệ sĩ, playlist, tâm trạng, thể loại. Thẻ "Tâm trạng của album" theo thời lượng.
- Trình phát: mini player (điện thoại), thanh phát (máy tính), màn hình phát toàn màn hình, danh sách chờ, trộn bài, lặp lại, tua, âm lượng.
- Điều khiển từ màn hình khoá/tai nghe, nhớ hàng đợi và vị trí đang nghe khi mở lại app.
- **Mood sync**: màu nền đổi theo tâm trạng bài đang phát.
- **Lời bài hát đồng bộ**: dòng đang hát sáng lên và tự cuộn theo nhạc, chạm vào dòng để tua tới đó (điện thoại: nút "Lời bài hát" trong trình phát; máy tính: tab bên phải). Xem lời bài bất kỳ từ menu "…", và **tìm kiếm theo lời** (không dấu).

**Giai đoạn 2 — Tương tác người dùng** ✅
- Tạo / đổi tên / xoá / sắp xếp playlist, thêm – bớt bài.
- Thích bài hát, lưu album, theo dõi nghệ sĩ, lịch sử nghe (tự ghi sau 10 giây nghe).
- Người dùng "khách": trình duyệt tự tạo mã khách, mọi dữ liệu cá nhân lưu trên server theo mã này.

**Giai đoạn 3 — Hoàn thiện sản phẩm**
- ✅ Đăng nhập bằng **Google** và bằng **số điện thoại Zalo + mã OTP** (xem mục [Đăng nhập](#đăng-nhập)). Dữ liệu của chế độ khách được chuyển vào tài khoản khi đăng nhập.
- Phân quyền, trang quản trị nội dung (chưa làm).
- Chuyển sang SQL Server: xem [server/src/data/mssql/README.md](server/src/data/mssql/README.md).

## Đăng nhập

Không cần mật khẩu. Server tạo phiên đăng nhập (token ngẫu nhiên, chỉ lưu bản băm) và client gửi lại qua `Authorization: Bearer …`.
Khi đăng nhập, playlist / bài đã thích / lịch sử của chế độ khách trên máy đó được gộp vào tài khoản.

### Zalo (số điện thoại + mã OTP)

Mã 6 số, hiệu lực 5 phút, nhập sai 5 lần thì khoá mã; gửi lại sau 60 giây, tối đa 5 lần/giờ/số.

- **Chạy thử (mặc định `OTP_PROVIDER=console`)**: không gửi tin thật — mã hiện ngay trên màn hình đăng nhập và in ra terminal server.
- **Gửi thật qua Zalo ZNS** (`OTP_PROVIDER=zalo`), cần:
  1. Một **Zalo Official Account** đã xác thực và ví ZCA có số dư (ZNS tính phí theo tin).
  2. Tạo ứng dụng tại [developers.zalo.me](https://developers.zalo.me), liên kết với OA, lấy `App ID`, `App Secret` và cho OA cấp quyền để có **refresh token**.
  3. Đăng ký **mẫu tin ZNS loại OTP** và chờ Zalo duyệt; ghi lại `template_id` và tên tham số chứa mã (thường là `otp`).
  4. Điền `ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_OA_REFRESH_TOKEN`, `ZALO_ZNS_TEMPLATE_ID`, `ZALO_ZNS_OTP_PARAM` vào `server/.env`.
     Đặt `ZALO_ZNS_MODE=development` để thử miễn phí với số điện thoại quản trị viên của OA.
  - Server tự làm mới access token và lưu refresh token mới vào `server/storage/secrets/` (Zalo đổi refresh token sau mỗi lần làm mới — đừng xoá thư mục này).

### Google

Dùng nút "Sign in with Google" chính thức; server tự kiểm chữ ký ID token bằng khoá công khai của Google. Miễn phí, chỉ cần một tài khoản Google.

1. Mở [Google Cloud Console](https://console.cloud.google.com/) → tạo project mới (ví dụ `Nocturne`).
2. **Google Auth Platform → Branding**: điền tên ứng dụng và email hỗ trợ.
3. **Audience**: chọn *External*. Ở trạng thái *Testing* chỉ các email trong **Test users** đăng nhập được —
   thêm email của bạn để thử, hoặc bấm **Publish app** cho mọi người (app chỉ lấy tên/email/ảnh nên không cần Google xét duyệt).
4. **Clients → Create client** → loại *Web application*:
   - **Authorized JavaScript origins**: `http://localhost:5173`, `http://localhost:4000`, và `https://<tên-miền>` nếu dùng trên điện thoại.
   - **Authorized redirect URIs**: `https://<tên-miền>/api/auth/google/redirect` (cho app PWA đã cài lên màn hình chính).
5. Sao chép **Client ID** rồi chạy:

   ```bash
   npm run setup:google -- 1234567890-abc.apps.googleusercontent.com
   ```

   Lệnh này tạo/cập nhật `server/.env` (tự sinh `AUTH_SECRET` nếu chưa có). Khởi động lại `npm run dev` là nút Google xuất hiện.

> Google **không** chấp nhận địa chỉ IP LAN (`http://192.168…`). Trên máy tính hãy mở `http://localhost:5173`;
> trên điện thoại cần một tên miền HTTPS (triển khai lên hosting, hoặc đường hầm như ngrok/cloudflared — nhớ thêm tên miền đó vào mục origins ở bước 4).

## Cấu trúc thư mục

```
app/
├─ shared/                 Kiểu dữ liệu (hợp đồng API) dùng chung client ↔ server
├─ server/
│  ├─ src/
│  │  ├─ config/           Đọc & kiểm tra biến môi trường (Zod)
│  │  ├─ core/             Lỗi HTTP, validate, xử lý lỗi tập trung, tiện ích
│  │  ├─ domain/           Bản ghi lưu trữ (≈ bảng database)
│  │  ├─ data/
│  │  │  ├─ repositories.ts  ← Interface tầng lưu trữ (service chỉ biết cái này)
│  │  │  ├─ json/            Bản cài đặt bằng file JSON (đang dùng)
│  │  │  └─ mssql/           Chỗ chừa cho SQL Server + schema.sql
│  │  └─ modules/          Mỗi nghiệp vụ một thư mục: *.routes.ts (HTTP + Zod) và *.service.ts
│  │     catalog · home · search · playlists · library · history · users
│  └─ storage/
│     ├─ seed/             Dữ liệu mẫu ban đầu (JSON)
│     ├─ data/             Dữ liệu đang chạy (tự tạo từ seed, không commit)
│     └─ media/            Nhạc MP3, ảnh bìa, ảnh nghệ sĩ
├─ client/
│  ├─ public/              Icon PWA
│  └─ src/
│     ├─ app/              Router
│     ├─ api/              HTTP client + hook TanStack Query
│     ├─ features/player/  Audio engine, store Zustand, giao diện trình phát
│     ├─ features/ui/      Store cho bảng (sheet) và thông báo (toast)
│     ├─ components/       layout · music · ui
│     ├─ pages/            Các trang
│     └─ styles/           Design tokens (màu, font, hiệu ứng kính)
└─ scripts/demo-content/   Bộ sinh nhạc demo + ảnh + icon + dữ liệu seed
```

**Luồng xử lý một request:** `route` (kiểm tra đầu vào bằng Zod) → `service` (nghiệp vụ, ghép DTO) → `repository interface` → bản JSON hoặc SQL Server.
Đổi nơi lưu trữ chỉ cần đặt `DATA_PROVIDER=mssql` sau khi viết xong các repository SQL.

## API chính

| Phương thức | Đường dẫn                                   | Mô tả                                   |
| ----------- | ------------------------------------------- | --------------------------------------- |
| GET         | `/api/home`, `/api/discover`                | Dữ liệu trang chủ / khám phá            |
| GET         | `/api/songs`, `/api/songs/:id`              | Bài hát (lọc theo mood, genre, artist…) |
| GET         | `/api/songs/:id/lyrics`                     | Lời bài hát (có mốc thời gian từng dòng) |
| GET         | `/api/albums/:id`, `/api/artists/:id`       | Chi tiết album / nghệ sĩ                |
| GET         | `/api/moods/:id`, `/api/genres/:id`         | Theo tâm trạng / thể loại               |
| GET         | `/api/search?q=`                            | Tìm kiếm                                |
| GET/POST    | `/api/playlists`, `/api/playlists/:id`      | Xem / tạo playlist                      |
| PATCH/DELETE| `/api/playlists/:id`                        | Sửa / xoá (chỉ chủ sở hữu)              |
| POST/PUT/DELETE | `/api/playlists/:id/songs`              | Thêm, sắp xếp, xoá bài                  |
| GET         | `/api/auth/config`                          | Phương thức đăng nhập đang bật           |
| POST        | `/api/auth/otp/send`, `/api/auth/otp/verify`| Gửi mã Zalo / xác nhận mã → đăng nhập    |
| POST        | `/api/auth/google`                          | Đăng nhập bằng ID token Google           |
| POST        | `/api/auth/logout`                          | Đăng xuất (huỷ phiên)                    |
| GET/PATCH   | `/api/me`                                   | Hồ sơ & tuỳ chọn                         |
| GET         | `/api/me/library`, `/api/me/library/ids`    | Tổng quan thư viện                       |
| PUT/DELETE  | `/api/me/favorites/:songId`                 | Thích / bỏ thích                         |
| PUT/DELETE  | `/api/me/albums/:id`, `/api/me/artists/:id` | Lưu album / theo dõi nghệ sĩ             |
| GET/POST/DELETE | `/api/me/history`                       | Lịch sử nghe                             |

Các API `/api/me/*` và thao tác ghi cần `Authorization: Bearer <token>` (đã đăng nhập) hoặc header `x-guest-id` (khách) — client tự gửi. Lỗi luôn có dạng `{ "error": { "code", "message", "details" } }`.

## Dữ liệu demo

Toàn bộ **22 bài nhạc** được *tổng hợp bằng code* (`scripts/demo-content/synth.mjs`: hợp âm, bass, trống, giai điệu, reverb…), ảnh bìa và ảnh nghệ sĩ được vẽ bằng SVG — không dùng tài nguyên có bản quyền.

```bash
npm run content:generate              # sinh lại phần còn thiếu
npm run content:generate -- --force   # render lại toàn bộ nhạc
npm run data:reset                    # xoá dữ liệu đang chạy, nạp lại từ seed
```

Lời bài hát demo là sáng tác gốc, nằm trong `scripts/demo-content/lyrics.mjs`. Bộ sinh nội dung tự canh thời gian từng dòng theo cấu trúc bài nhạc (verse → đoạn A, điệp khúc → đoạn có giai điệu chính) và ghi ra `storage/seed/lyrics.json`. Lời của bài thật có thể nhập dạng `[{ "time": 12.5, "text": "..." }]` vào file này (hoặc bảng `SongLyricLines` khi dùng SQL Server).

Thêm bài hát/album mới: sửa `scripts/demo-content/catalog.mjs` rồi chạy lệnh sinh nội dung và `npm run data:reset`.

## Cấu hình

Sao chép `server/.env.example` thành `server/.env` nếu cần đổi cổng, thư mục dữ liệu, `MEDIA_BASE_URL` (ví dụ dùng CDN) hoặc chuỗi kết nối SQL Server.

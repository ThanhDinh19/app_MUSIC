/**
 * Cấu hình PM2 — chạy Nocturne trên server không dùng Docker.
 *
 *   npm ci && npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup      # tự chạy lại khi server khởi động lại
 *
 * Cấu hình app (AUTH_SECRET, GOOGLE_CLIENT_ID, ...) nằm trong server/.env.
 * deploy/install.sh đặt NOCTURNE_NODE (Node.js 22 riêng của app) và NOCTURNE_PORT trước khi gọi PM2.
 */
module.exports = {
  apps: [
    {
      name: 'music-app',
      script: 'server/dist/index.js',
      cwd: __dirname,
      // Dùng Node.js riêng của Nocturne nếu có → không phụ thuộc phiên bản Node của app khác trên server.
      interpreter: process.env.NOCTURNE_NODE || 'node',
      node_args: '--enable-source-maps',
      // Dữ liệu JSON nằm trong bộ nhớ của tiến trình → CHỈ được chạy 1 instance (không dùng cluster).
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        ...(process.env.NOCTURNE_PORT ? { PORT: process.env.NOCTURNE_PORT } : {}),
      },
      // Cho server thời gian ghi nốt dữ liệu JSON xuống đĩa khi restart/stop.
      kill_timeout: 8000,
      max_memory_restart: '500M',
      time: true,
    },
  ],
};

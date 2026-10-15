import { existsSync } from 'node:fs';
import { join } from 'node:path';
import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import type { AppConfig } from './config/env';
import { errorHandler } from './core/error-handler';
import { requestLogger } from './core/request-logger';
import { createApiRouter } from './modules/api.router';
import type { Services } from './modules/services';

export function createApp(config: AppConfig, services: Services): Express {
  const app = express();
  app.disable('x-powered-by');
  // Lấy đúng IP người dùng khi chạy sau proxy/đường hầm cục bộ (cloudflared, nginx...) — dùng cho giới hạn gửi OTP.
  app.set('trust proxy', 'loopback');

  if (config.corsOrigins.length > 0) app.use(cors({ origin: config.corsOrigins }));
  app.use(compression());
  app.use(express.json({ limit: '64kb' }));
  if (!config.isProduction) app.use(requestLogger);

  // File nhạc & ảnh. express.static hỗ trợ sẵn HTTP Range → tua nhạc được trên mọi trình duyệt.
  app.use(
    '/media',
    express.static(config.mediaDir, {
      index: false,
      fallthrough: false,
      maxAge: config.isProduction ? '7d' : 0,
    }),
  );

  app.use('/api', createApiRouter(services));

  // Production: phục vụ luôn giao diện PWA đã build (client/dist).
  const indexHtml = join(config.clientDistDir, 'index.html');
  if (existsSync(indexHtml)) {
    app.use(
      express.static(config.clientDistDir, {
        index: false,
        setHeaders(res, filePath) {
          if (/[\\/]assets[\\/]/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            // sw.js, manifest, index.html... luôn kiểm tra bản mới để PWA cập nhật kịp thời.
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      }),
    );
    // SPA fallback: mọi đường dẫn GET còn lại trả về index.html để React Router xử lý.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);
  return app;
}

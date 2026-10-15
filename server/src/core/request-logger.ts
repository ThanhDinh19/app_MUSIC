import type { RequestHandler } from 'express';

/** Log gọn: method, đường dẫn, mã trạng thái và thời gian xử lý (chỉ cho /api). */
export const requestLogger: RequestHandler = (req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  const started = performance.now();
  res.on('finish', () => {
    const ms = (performance.now() - started).toFixed(1);
    const color = res.statusCode >= 500 ? 31 : res.statusCode >= 400 ? 33 : 32;
    console.log(`\x1b[${color}m${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} \x1b[2m${ms}ms\x1b[0m`);
  });
  next();
};

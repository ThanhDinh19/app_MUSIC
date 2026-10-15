import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody } from '@nocturne/shared';
import { HttpError } from './http-error';

export const apiNotFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', `Không có API ${req.method} ${req.originalUrl}`));
};

/** Xử lý lỗi tập trung: mọi lỗi đều trả về cùng một định dạng JSON. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = { error: { code: 'INTERNAL_ERROR', message: 'Đã có lỗi xảy ra phía máy chủ.' } };

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    body = { error: { code: 'INVALID_JSON', message: 'Body không phải JSON hợp lệ.' } };
  } else if (typeof err?.status === 'number' && err.status < 500) {
    // Lỗi từ express.static / body-parser (404 file media, payload quá lớn...)
    status = err.status;
    body = { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: err.expose ? err.message : 'Yêu cầu không hợp lệ.' } };
  }

  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err);
  if (res.headersSent) return;
  res.status(status).json(body);
};

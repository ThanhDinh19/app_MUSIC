import type { z } from 'zod';
import { HttpError } from './http-error';

/** Kiểm tra dữ liệu đầu vào bằng Zod; ném lỗi 400 kèm danh sách trường sai nếu không hợp lệ. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Dữ liệu gửi lên không hợp lệ.',
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}

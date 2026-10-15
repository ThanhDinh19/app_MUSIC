import type { Repositories } from '../repositories';

/**
 * Chỗ chừa sẵn cho SQL Server (giai đoạn 3).
 *
 * Các bước triển khai (chi tiết trong README.md cùng thư mục):
 *   1. `npm install mssql -w server`
 *   2. Chạy schema.sql để tạo bảng, rồi import dữ liệu từ storage/data/*.json.
 *   3. Viết các class Mssql*Repository implement interface trong ../repositories.ts
 *      (mỗi class ánh xạ 1-1 với class Json*Repository hiện có).
 *   4. Trả về chúng ở hàm dưới đây và đặt DATA_PROVIDER=mssql.
 */
export async function createMssqlRepositories(options: { connectionString?: string }): Promise<Repositories> {
  if (!options.connectionString) {
    throw new Error('DATA_PROVIDER=mssql nhưng chưa cấu hình MSSQL_CONNECTION_STRING.');
  }
  throw new Error(
    'SQL Server provider chưa được triển khai. Xem server/src/data/mssql/README.md — tạm thời dùng DATA_PROVIDER=json.',
  );
}

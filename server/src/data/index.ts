import type { AppConfig } from '../config/env';
import { createJsonRepositories } from './json';
import { createMssqlRepositories } from './mssql';
import type { Repositories } from './repositories';

/** Chọn bộ repository theo cấu hình DATA_PROVIDER. Đây là điểm DUY NHẤT biết dữ liệu nằm ở đâu. */
export async function createRepositories(config: AppConfig): Promise<Repositories> {
  switch (config.dataProvider) {
    case 'json':
      return createJsonRepositories({ dataDir: config.dataDir, seedDir: config.seedDir });
    case 'mssql':
      return createMssqlRepositories({ connectionString: config.mssqlConnectionString });
  }
}

export type { Repositories } from './repositories';

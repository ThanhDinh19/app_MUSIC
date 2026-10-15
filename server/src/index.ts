import { networkInterfaces } from 'node:os';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from './app';
import { config } from './config/env';
import { createRepositories } from './data';
import { createServices } from './modules/services';

const repos = await createRepositories(config);
const services = createServices(repos, config);
const app = createApp(config, services);

const server = app.listen(config.port, config.host, (error?: Error) => {
  if (error) {
    console.error('❌ Không khởi động được server:', error.message);
    process.exit(1);
  }
  const lan = Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => `http://${net!.address}:${config.port}`);
  const servesClient = existsSync(join(config.clientDistDir, 'index.html'));
  console.log(`\n🎧 Nocturne API đang chạy (${config.env}, dữ liệu: ${config.dataProvider})`);
  console.log(`   Local:   http://localhost:${config.port}/api/health`);
  for (const url of lan) console.log(`   Mạng LAN: ${url}`);
  if (servesClient) console.log('   Đang phục vụ giao diện từ client/dist');
  console.log('');
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} — đang lưu dữ liệu và tắt server...`);
  server.close();
  await repos.close();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

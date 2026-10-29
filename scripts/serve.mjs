// 예제 테마 보기 (yarn start / npm start)
//  docs/guide.html 을 로컬 서버로 띄운다. 페이지 우측 하단의 auto / light / dark 버튼으로 테마를 전환한다.
//  사용법: node scripts/serve.mjs [--port 5173] [--open]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const startPort = portIdx >= 0 ? Number(args[portIdx + 1]) : 5173;

if (!existsSync(join(root, 'docs/guide.html'))) {
  console.error('docs/guide.html 이 없습니다. `yarn build` 를 먼저 실행하세요.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request'); // 잘못된 % 인코딩으로 서버가 죽지 않게 한다
    return;
  }
  if (path === '/') path = '/docs/guide.html';
  const file = normalize(join(root, path));
  // 저장소 밖 경로 접근 차단, dist / docs 만 공개. (구분자까지 비교해야 `docs-x` 같은 형제 폴더가 통과하지 않는다)
  const allowed = [join(root, 'docs'), join(root, 'dist')].some((dir) => file.startsWith(dir + sep));
  if (!allowed) {
    res.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

const listen = (port) => {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < startPort + 20) listen(port + 1);
    else throw err;
  });
  // 로컬 전용: 같은 네트워크의 다른 기기에 노출하지 않는다.
  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}/`;
    console.log(`테마 예제: ${url}docs/examples.html`);
    console.log(`가이드   : ${url}  (종료: Ctrl+C)`);
    if (args.includes('--open')) {
      const target = `${url}docs/examples.html`;
      const [cmd, cmdArgs] =
        process.platform === 'win32' ? ['cmd', ['/c', 'start', '', target]] : process.platform === 'darwin' ? ['open', [target]] : ['xdg-open', [target]];
      spawn(cmd, cmdArgs, { stdio: 'ignore', detached: true }).unref();
    }
  });
};

listen(startPort);

// Claude Code PostToolUse 훅 : src/ 아래 파일을 수정하면 곧바로 SCSS 가 컴파일되는지 확인한다.
//  - stdin 으로 훅 입력(JSON)을 받는다. src/ 의 .scss 가 아니면 아무 것도 하지 않는다.
//  - 컴파일 실패 / 경고가 있으면 stderr 로 알리고 종료 코드 2 를 반환해 Claude 에게 피드백한다.
//  - 전체 빌드(yarn test, 약 10초)보다 훨씬 가벼운 "빠른 확인"이다. 마무리에는 yarn test 를 실행한다.
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0); // 입력을 읽을 수 없으면 조용히 통과
}

const file = input?.tool_input?.file_path;
if (!file) process.exit(0);
const rel = relative(root, resolve(file)).replace(/\\/g, '/');
if (!rel.startsWith('src/') || !rel.endsWith('.scss')) process.exit(0);

let sass;
try {
  sass = createRequire(import.meta.url)('sass');
} catch {
  // 의존성이 설치되지 않은 환경(첫 clone 등)에서는 훅이 작업을 막지 않도록 안내만 하고 통과한다.
  console.error('[ui-style] sass 가 설치되어 있지 않아 빠른 확인을 건너뜁니다. `yarn install` 후 다시 시도하세요.');
  process.exit(0);
}
const warnings = [];
const entries = ['src/css/style.scss', 'src/index.scss'];
try {
  for (const entry of entries) {
    sass.compile(resolve(root, entry), {
      loadPaths: [resolve(root, 'src')],
      logger: { warn: (m) => warnings.push(m.split('\n')[0]), debug: () => {} },
    });
  }
} catch (e) {
  console.error(`[ui-style] ${rel} 수정 후 SCSS 컴파일 실패\n${String(e.message).split('\n').slice(0, 8).join('\n')}`);
  process.exit(2);
}

if (warnings.length) {
  console.error(`[ui-style] ${rel} 수정 후 Sass 경고 ${warnings.length}건 (경고 0건이 규칙)\n${[...new Set(warnings)].slice(0, 5).join('\n')}`);
  process.exit(2);
}
process.exit(0);

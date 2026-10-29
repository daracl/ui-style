// dist/ CSS(+min) 와 docs/guide.html 을 한 프로세스에서 생성한다. (yarn build)
//  sass CLI 를 파일마다 따로 띄우면 Node 시작 + sass 로딩이 반복되므로, 한 번만 로드해서 모두 컴파일한다.
//  사용법: node scripts/build.mjs [--css-only] [--min-only]
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = new Set(process.argv.slice(2));
const dist = join(root, 'dist');

// [진입 파일, 산출 이름]
const entries = [
  ['src/css/style.scss', 'style'],
  ['src/css/theme-vars.scss', 'theme-vars'],
];
const styles = args.has('--min-only') ? ['compressed'] : args.has('--css-only') ? ['expanded'] : ['expanded', 'compressed'];

// 전체 빌드에서만 dist 를 비운다. (부분 빌드는 다른 산출물을 지우지 않는다)
if (styles.length === 2) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const [entry, name] of entries) {
  for (const style of styles) {
    const { css } = sass.compile(join(root, entry), { style, sourceMap: false, loadPaths: [join(root, 'src')] });
    writeFileSync(join(dist, `${name}${style === 'compressed' ? '.min' : ''}.css`), `${css}\n`);
  }
}

// 가이드는 dist/theme-vars.css 를 읽는다. 전체 빌드에서만 생성한다.
if (styles.length === 2) await import('./build-guide.mjs');

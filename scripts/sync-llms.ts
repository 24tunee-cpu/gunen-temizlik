import fs from 'node:fs';
import path from 'node:path';

const FILES = ['llms.txt', 'llms-full.txt'] as const;

function syncFile(rootDir: string, fileName: (typeof FILES)[number]) {
  const sourcePath = path.resolve(rootDir, fileName);
  const targetPath = path.resolve(rootDir, 'public', fileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const source = fs.readFileSync(sourcePath, 'utf8');
  const target = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;

  if (target === source) {
    console.log(`[SKIP] ${fileName} already in sync`);
    return;
  }

  fs.writeFileSync(targetPath, source, 'utf8');
  console.log(`[SYNC] ${fileName} -> public/${fileName}`);
}

function main() {
  const rootDir = process.cwd();
  FILES.forEach((fileName) => syncFile(rootDir, fileName));
}

main();

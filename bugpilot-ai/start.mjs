// One command to run everything:  npm start   (or: node start.mjs)
// On first run it creates a Python venv, installs backend + frontend dependencies,
// creates .env from .env.example, then starts FastAPI (8000) and Vite (5173) together.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BACKEND = join(ROOT, 'backend');
const FRONTEND = join(ROOT, 'frontend');
const isWin = process.platform === 'win32';
const log = (m) => console.log(`\x1b[36m[bugpilot]\x1b[0m ${m}`);
const fail = (m) => { console.error(`\x1b[31m[bugpilot] ${m}\x1b[0m`); process.exit(1); };
const run = (cmd, args, cwd) =>
  spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false }).status === 0;

// 1. .env
const envPath = join(ROOT, '.env');
if (!existsSync(envPath)) {
  copyFileSync(join(ROOT, '.env.example'), envPath);
  const secret = randomBytes(48).toString('base64url');
  writeFileSync(envPath, readFileSync(envPath, 'utf8').replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`));
  log('Created .env with a fresh JWT secret. Make sure Ollama is running with the configured model.');
}

// 2. Python (>= 3.10)
function findPython() {
  for (const c of ['python3', 'python', 'py']) {
    const r = spawnSync(c, ['-c', 'import sys;print(int(sys.version_info>=(3,10)))'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim() === '1') return c;
  }
  return null;
}
const venvDir = join(BACKEND, '.venv');
const venvPy = join(venvDir, isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');
if (!existsSync(venvPy)) {
  const py = findPython();
  if (!py) fail('Python 3.10+ is required but was not found. Install it from https://www.python.org/downloads/');
  log('Creating Python virtual environment...');
  if (!run(py, ['-m', 'venv', venvDir], BACKEND)) fail('Could not create the virtual environment.');
}

// 3. Backend dependencies (reinstall only if requirements.txt changed)
const reqFile = join(BACKEND, 'requirements.txt');
const reqHash = createHash('sha256').update(readFileSync(reqFile)).digest('hex');
const marker = join(venvDir, '.requirements.sha256');
if (!existsSync(marker) || readFileSync(marker, 'utf8') !== reqHash) {
  log('Installing backend dependencies...');
  if (!run(venvPy, ['-m', 'pip', 'install', '-r', reqFile], BACKEND)) fail('Backend dependency install failed.');
  writeFileSync(marker, reqHash);
}

// 4. Frontend dependencies
if (!existsSync(join(FRONTEND, 'node_modules'))) {
  log('Installing frontend dependencies (first run only)...');
  const ok = spawnSync(isWin ? 'npm.cmd' : 'npm', ['install'], { cwd: FRONTEND, stdio: 'inherit', shell: isWin }).status === 0;
  if (!ok) fail('Frontend dependency install failed.');
}

// 5. Start both servers
log('Starting backend  -> http://localhost:8000  (API docs: /docs)');
log('Starting frontend -> http://localhost:5173  (open this one)\n');
const children = [
  spawn(venvPy, ['-m', 'uvicorn', 'app.main:app', '--reload', '--reload-dir', 'app', '--port', '8000'], { cwd: BACKEND, stdio: 'inherit' }),
  spawn(process.execPath, [join(FRONTEND, 'node_modules', 'vite', 'bin', 'vite.js')], { cwd: FRONTEND, stdio: 'inherit' }),
];
let closing = false;
const shutdown = (code = 0) => {
  if (closing) return;
  closing = true;
  children.forEach((c) => { try { c.kill(); } catch {} });
  setTimeout(() => process.exit(code), 300);
};
children.forEach((c) => c.on('exit', (code) => { if (!closing) { log('A server stopped, shutting down.'); shutdown(code ?? 1); } }));
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

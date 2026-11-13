@echo off
setlocal
set "launcher=%~f0"
set "pytemp=%TEMP%\BugPilotLauncher-%RANDOM%-%RANDOM%.py"
set "LAUNCHER_FILE=%launcher%"
set "PY_LAUNCHER_TEMP=%pytemp%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p = $env:LAUNCHER_FILE; $o = $env:PY_LAUNCHER_TEMP; $s = Get-Content -LiteralPath $p; $m = [Array]::IndexOf($s, '# === PYTHON PAYLOAD ==='); if ($m -lt 0) { exit 2 }; [IO.File]::WriteAllLines($o, $s[($m+1)..($s.Length-1)], [Text.UTF8Encoding]::new($false))"
if errorlevel 1 (
  echo Could not prepare BugPilot launcher.
  pause
  exit /b 1
)
set "LAUNCHER_FILE=%launcher%"
set "PY_LAUNCHER_TEMP=%pytemp%"
where.exe py >nul 2>&1
if not errorlevel 1 (
  py -3 "%pytemp%"
) else (
  python "%pytemp%"
)
set "exitcode=%ERRORLEVEL%"
del "%pytemp%" >nul 2>&1
exit /b %exitcode%

# === PYTHON PAYLOAD ===
from __future__ import annotations
import os
import platform
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND_URL = 'http://localhost:5173'
OLLAMA_CMD = 'ollama'


def say(message: str) -> None:
    print(f'[BugPilot] {message}', flush=True)


def run(command: list[str], *, cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(command, cwd=cwd, check=check)


def wait_for(url: str, seconds: int = 120) -> bool:
    deadline = time.time() + seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2):
                return True
        except Exception:
            time.sleep(1)
    return False


def ollama_available() -> bool:
    try:
        with urllib.request.urlopen('http://localhost:11434/api/tags', timeout=2):
            return True
    except Exception:
        return False


def install_ollama() -> None:
    system = platform.system()
    say('Ollama is not installed or its service is not responding. Installing Ollama...')
    if system == 'Windows':
        if not shutil.which('winget'):
            raise RuntimeError('Ollama is missing. Install Ollama from https://ollama.com/download and run this launcher again.')
        run(['winget', 'install', '--id', 'Ollama.Ollama', '--exact', '--accept-package-agreements', '--accept-source-agreements'])
    elif system == 'Darwin':
        if not shutil.which('brew'):
            raise RuntimeError('Ollama is missing. Install Ollama from https://ollama.com/download and run this launcher again (or install Homebrew first).')
        run(['brew', 'install', 'ollama'])
    elif system == 'Linux':
        run(['sh', '-c', 'curl -fsSL https://ollama.com/install.sh | sh'])
    else:
        raise RuntimeError(f'Automatic Ollama setup is not supported on {system}.')
    if system == 'Windows':
        candidates = [
            Path(os.environ.get('LOCALAPPDATA', '')) / 'Programs' / 'Ollama' / 'ollama.exe',
            Path(os.environ.get('ProgramW6432', 'C:\\Program Files')) / 'Ollama' / 'ollama.exe',
        ]
        for candidate in candidates:
            if candidate.is_file():
                os.environ['PATH'] = str(candidate.parent) + os.pathsep + os.environ.get('PATH', '')
                return


def ensure_ollama() -> subprocess.Popen | None:
    global OLLAMA_CMD
    if not shutil.which('ollama'):
        install_ollama()
    OLLAMA_CMD = shutil.which('ollama') or OLLAMA_CMD
    if not shutil.which(OLLAMA_CMD) and not Path(OLLAMA_CMD).is_file():
        raise RuntimeError('Ollama was installed, but its command is not available yet. Restart your computer and run this launcher again.')
    service = None
    if not ollama_available():
        say('Starting the Ollama service...')
        service = subprocess.Popen([OLLAMA_CMD, 'serve'], cwd=ROOT,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if not wait_for('http://localhost:11434/api/tags', 90):
            raise RuntimeError('Ollama did not start. Check that port 11434 is available, then try again.')
    env_file = ROOT / '.env'
    model = 'qwen2.5:0.5b'
    if env_file.exists():
        for line in env_file.read_text(encoding='utf-8').splitlines():
            if line.strip().startswith('OLLAMA_MODEL='):
                model = line.split('=', 1)[1].strip().strip('"\'') or model
    if model:
        with urllib.request.urlopen('http://localhost:11434/api/tags', timeout=10) as response:
            models = [item.get('name', '') for item in __import__('json').load(response).get('models', [])]
        if model not in models and f'{model}:latest' not in models:
            say(f'Downloading the configured Ollama model ({model}); this can take a while the first time...')
            run([OLLAMA_CMD, 'pull', model], cwd=ROOT)
    return service


def main() -> int:
    if sys.version_info < (3, 10):
        raise RuntimeError('Python 3.10 or newer is required. Install it, then double-click this file again.')
    if not (ROOT / 'start.mjs').is_file() or not (ROOT / 'frontend').is_dir():
        raise RuntimeError('Keep this launcher in the BugPilot project folder beside start.mjs.')
    if not shutil.which('node') or not shutil.which('npm'):
        raise RuntimeError('Node.js (which includes npm) is required. Install the current LTS release from https://nodejs.org, then run this file again.')

    service = ensure_ollama()
    say('Installing any missing BugPilot dependencies and starting its servers...')
    server = subprocess.Popen(['node', 'start.mjs'], cwd=ROOT)
    try:
        if not wait_for(FRONTEND_URL, 240):
            raise RuntimeError('BugPilot did not become ready. Read the startup messages above for the dependency or port error.')
        say(f'Opening {FRONTEND_URL}')
        webbrowser.open(FRONTEND_URL)
        say('BugPilot is running. Keep this window open; close it to stop the app.')
        return server.wait()
    finally:
        if server.poll() is None:
            server.terminate()
            try:
                server.wait(timeout=8)
            except subprocess.TimeoutExpired:
                server.kill()
        # Keep Ollama available for other local apps; its service is intentionally left running.


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f'\nBugPilot could not start: {error}', file=sys.stderr, flush=True)
        if sys.stdin.isatty():
            input('Press Enter to close...')
        raise SystemExit(1)


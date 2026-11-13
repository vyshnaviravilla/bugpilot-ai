"""Read a bounded set of source files from uploaded ZIPs without extracting them."""
import zipfile
from pathlib import PurePosixPath

MAX_ARCHIVE_BYTES = 50 * 1024 * 1024
MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024
MAX_FILE_BYTES = 256 * 1024
MAX_SOURCE_CHARS = 12_000
SOURCE_SUFFIXES = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rs", ".php",
    ".rb", ".cs", ".cpp", ".c", ".h", ".html", ".css", ".scss", ".sql",
    ".json", ".yml", ".yaml", ".toml",
}
SKIP_PARTS = {
    "node_modules", "vendor", ".git", "dist", "build", "coverage", "__pycache__",
    ".venv", "venv", "target", "uploads",
}
SKIP_NAMES = {
    ".env", ".env.local", ".env.production", "id_rsa", "id_ed25519",
    "credentials.json", "secrets.json", "service-account.json",
    "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "poetry.lock",
    "cargo.lock", "composer.lock",
}


def inspect_project_zip(path: str) -> tuple[str, list[str]]:
    """Return capped, text-only source context and the included relative file names."""
    chunks: list[str] = []
    included: list[str] = []
    remaining = MAX_SOURCE_CHARS
    with zipfile.ZipFile(path) as archive:
        infos = [item for item in archive.infolist() if not item.is_dir()]
        if len(infos) > 10_000:
            raise ValueError("ZIP contains too many files to analyze")
        if sum(item.file_size for item in infos) > MAX_UNCOMPRESSED_BYTES:
            raise ValueError("ZIP expands beyond the 100 MB analysis limit")
        # Put actual source files before manifests so a large config cannot consume the context cap.
        infos.sort(key=lambda item: (PurePosixPath(item.filename.replace("\\", "/")).suffix.lower()
                                    in {".json", ".yml", ".yaml", ".toml"}, item.filename.lower()))
        for item in infos:
            if remaining <= 0:
                break
            normalized = item.filename.replace("\\", "/")
            rel = PurePosixPath(normalized)
            parts = [part.lower() for part in rel.parts]
            if rel.is_absolute() or ".." in rel.parts or any(part in SKIP_PARTS for part in parts):
                continue
            if (rel.name.lower() in SKIP_NAMES or rel.name.lower().startswith(".env")
                    or rel.suffix.lower() not in SOURCE_SUFFIXES):
                continue
            if item.file_size > MAX_FILE_BYTES:
                continue
            try:
                raw = archive.read(item)
                decoded = raw.decode("utf-8")
            except (UnicodeDecodeError, OSError, RuntimeError, zipfile.BadZipFile):
                continue
            excerpt = decoded[:remaining]
            if not excerpt.strip():
                continue
            chunks.append(f"--- FILE: {normalized} ---\n{excerpt}")
            included.append(normalized)
            remaining -= len(excerpt)
    if not chunks:
        raise ValueError("No readable source files found in this ZIP")
    return "\n\n".join(chunks), included

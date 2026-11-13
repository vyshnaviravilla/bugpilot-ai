import logging
import secrets
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]
log = logging.getLogger("bugpilot")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    app_name: str = "BugPilot AI"
    app_version: str = "0.1.0"

    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 480

    database_url: str = f"sqlite:///{(ROOT / 'backend' / 'data' / 'bugpilot.db').as_posix()}"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    ai_timeout_seconds: float = 180.0
    ai_max_retries: int = 0

    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "qwen2.5:0.5b"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if not s.jwt_secret or s.jwt_secret == "change-me":
        s.jwt_secret = secrets.token_urlsafe(48)
        log.warning("JWT_SECRET is not set. Using a temporary secret; logins reset on restart.")
    return s

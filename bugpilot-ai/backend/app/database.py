from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings

_url = make_url(get_settings().database_url)
_is_sqlite = _url.get_backend_name() == "sqlite"
if _is_sqlite and _url.database and _url.database != ":memory:":
    Path(_url.database).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    _url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def migrate_user_roles() -> None:
    """Add employer to the existing SQLite role constraint without losing users."""
    if not _is_sqlite:
        return
    raw = engine.raw_connection()
    cursor = None
    try:
        cursor = raw.cursor()
        row = cursor.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
        ).fetchone()
        if not row or "employer" in (row[0] or "").lower():
            return
        cursor.execute("PRAGMA foreign_keys=OFF")
        cursor.execute("BEGIN IMMEDIATE")
        cursor.execute("""
            CREATE TABLE users_new (
                id INTEGER NOT NULL PRIMARY KEY,
                name VARCHAR(80) NOT NULL,
                email VARCHAR(254) NOT NULL,
                password_hash VARCHAR(128) NOT NULL,
                role VARCHAR(16) NOT NULL,
                created_at DATETIME NOT NULL,
                CONSTRAINT ck_users_role CHECK (role IN ('qa','developer','employer'))
            )
        """)
        cursor.execute("""
            INSERT INTO users_new (id,name,email,password_hash,role,created_at)
            SELECT id,name,email,password_hash,role,created_at FROM users
        """)
        cursor.execute("DROP TABLE users")
        cursor.execute("ALTER TABLE users_new RENAME TO users")
        cursor.execute("CREATE UNIQUE INDEX ix_users_email ON users (email)")
        cursor.execute("CREATE INDEX ix_users_role ON users (role)")
        raw.commit()
    except Exception:
        raw.rollback()
        raise
    finally:
        if cursor is not None:
            cursor.execute("PRAGMA foreign_keys=ON")
        raw.close()


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

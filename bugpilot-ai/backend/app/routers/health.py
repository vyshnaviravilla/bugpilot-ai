from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    s = get_settings()
    try:
        db.execute(text("SELECT 1"))
        db_state = "ok"
    except Exception:
        db_state = "error"
    return {
        "status": "ok" if db_state == "ok" else "degraded",
        "app": s.app_name,
        "version": s.app_version,
        "database": db_state,
        "time": datetime.now(timezone.utc).isoformat(),
    }

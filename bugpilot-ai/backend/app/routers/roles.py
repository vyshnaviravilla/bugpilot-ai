"""Role-protected endpoints. Real feature routes (bugs, reports...) will be added here later."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_role
from ..models import User

router = APIRouter(tags=["roles"])


def _counts(db: Session) -> dict:
    rows = db.execute(select(User.role, func.count()).group_by(User.role)).all()
    counts = {"qa": 0, "developer": 0, "employer": 0}
    counts.update({role: n for role, n in rows})
    return counts


@router.get("/qa/overview")
def qa_overview(user: User = Depends(require_role("qa")), db: Session = Depends(get_db)):
    return {"role": "qa", "user": user.name, "registered_users": _counts(db)}


@router.get("/developer/overview")
def developer_overview(user: User = Depends(require_role("developer")), db: Session = Depends(get_db)):
    return {"role": "developer", "user": user.name, "registered_users": _counts(db)}


@router.get("/employer/overview")
def employer_overview(user: User = Depends(require_role("employer")), db: Session = Depends(get_db)):
    return {"role": "employer", "user": user.name, "registered_users": _counts(db)}

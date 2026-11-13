from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import BugReport, User
from ..schemas import BugReportIn, BugReportOut, BugReportUpdate

router = APIRouter(prefix="/bug-reports", tags=["bug-reports"])


@router.post("/", response_model=BugReportOut, status_code=status.HTTP_201_CREATED)
def create_bug_report(
    data: BugReportIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new bug report (QA only)."""
    if current_user.role != "qa":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only QA users can create bug reports")
    
    bug_report = BugReport(
        project_id=data.project_id,
        title=data.title,
        description=data.description,
        severity=data.severity,
        reported_by=current_user.id
    )
    db.add(bug_report)
    db.commit()
    db.refresh(bug_report)
    
    return bug_report


@router.get("/", response_model=List[BugReportOut])
def list_bug_reports(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List bug reports. QA sees all, developers see assigned ones."""
    if current_user.role not in {"qa", "developer"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bug reports are available to QA and developers")
    if current_user.role == "qa":
        query = select(BugReport)
        if project_id:
            query = query.where(BugReport.project_id == project_id)
    else:
        # Developers can see their assigned reports and open reports available to claim.
        query = select(BugReport).where(or_(
            BugReport.assigned_to == current_user.id,
            and_(BugReport.assigned_to.is_(None), BugReport.status == "open"),
        ))
        if project_id:
            query = query.where(BugReport.project_id == project_id)
    
    bug_reports = db.scalars(query.order_by(BugReport.created_at.desc())).all()
    return bug_reports


@router.get("/{bug_report_id}", response_model=BugReportOut)
def get_bug_report(
    bug_report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific bug report."""
    if current_user.role not in {"qa", "developer"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bug reports are available to QA and developers")
    bug_report = db.scalar(select(BugReport).where(BugReport.id == bug_report_id))
    
    if not bug_report:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bug report not found")
    
    # QA can see all, developers only see assigned
    if current_user.role == "developer" and bug_report.assigned_to != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only view assigned bug reports")
    
    return bug_report


@router.patch("/{bug_report_id}", response_model=BugReportOut)
def update_bug_report(
    bug_report_id: int,
    data: BugReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update bug report status or assignment (developers only)."""
    if current_user.role != "developer":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only developers can update bug reports")
    
    bug_report = db.scalar(select(BugReport).where(BugReport.id == bug_report_id))
    
    if not bug_report:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bug report not found")
    
    claiming = bug_report.assigned_to is None and data.assigned_to == current_user.id
    if bug_report.assigned_to != current_user.id and not claiming:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only update assigned bug reports")
    
    if data.status is not None:
        bug_report.status = data.status
    if data.assigned_to is not None:
        if data.assigned_to != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only assign a report to yourself")
        bug_report.assigned_to = data.assigned_to
    
    db.commit()
    db.refresh(bug_report)
    
    return bug_report


@router.delete("/{bug_report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bug_report(
    bug_report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a bug report (QA only)."""
    if current_user.role != "qa":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only QA users can delete bug reports")
    
    bug_report = db.scalar(select(BugReport).where(BugReport.id == bug_report_id))
    
    if not bug_report:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bug report not found")
    
    db.delete(bug_report)
    db.commit()

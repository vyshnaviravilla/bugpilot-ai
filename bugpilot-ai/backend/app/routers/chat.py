import json
import re
import zipfile
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import BugReport, ChatMessage, DirectMessage, Project, User
from ..schemas import AIChatIn, AIChatOut, BugReportOut, ChatMessageIn, ChatMessageOut, DirectMessageIn, DirectMessageOut, UserOut
from ..services.ai.manager import get_ai_response
from ..services.project_inspector import inspect_project_zip

router = APIRouter(prefix="/chat", tags=["chat"])


def _direct_pair_allowed(user: User, contact: User) -> bool:
    staff_roles = {"qa", "developer"}
    return ((user.role == "employer" and contact.role in staff_roles)
            or (user.role in staff_roles and contact.role in {*staff_roles, "employer"}))


@router.get("/contacts", response_model=List[UserOut])
def list_chat_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Employers can find staff; staff can reply to employers in direct chat."""
    if current_user.role == "employer":
        roles = ("qa", "developer")
    elif current_user.role in {"qa", "developer"}:
        roles = ("qa", "developer", "employer")
    else:
        roles = ()
    return db.scalars(
        select(User).where(User.role.in_(roles), User.id != current_user.id).order_by(User.name)
    ).all()


@router.get("/direct/{contact_id}", response_model=List[DirectMessageOut])
def get_direct_messages(contact_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contact = db.get(User, contact_id)
    if not contact or not _direct_pair_allowed(current_user, contact):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat contact not found")
    rows = db.scalars(
        select(DirectMessage).where(or_(
            (DirectMessage.sender_id == current_user.id) & (DirectMessage.recipient_id == contact.id),
            (DirectMessage.sender_id == contact.id) & (DirectMessage.recipient_id == current_user.id),
        )).order_by(DirectMessage.created_at.desc()).limit(200)
    ).all()
    return list(reversed(rows))


@router.post("/direct/{contact_id}", response_model=DirectMessageOut, status_code=status.HTTP_201_CREATED)
def send_direct_message(contact_id: int, data: DirectMessageIn,
                        db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contact = db.get(User, contact_id)
    if not contact or not _direct_pair_allowed(current_user, contact):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat contact not found")
    text = data.message.strip()
    if not text:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Message cannot be blank")
    message = DirectMessage(sender_id=current_user.id, recipient_id=contact.id, message=text)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.post("/ai", response_model=AIChatOut)
async def chat_with_ai(
    data: AIChatIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Chat with Vincy AI assistant."""
    project_context = None
    project = None
    if data.project_id is not None:
        project = db.scalar(select(Project).where(
            Project.id == data.project_id,
            Project.uploaded_by == current_user.id,
        ))
        if not project:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Uploaded project not found")
        try:
            project_context, _ = inspect_project_zip(project.file_path)
        except (OSError, ValueError, zipfile.BadZipFile) as exc:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))

    issue_words = re.search(
        r"\b(bug|issue|error|fails?|broken|crash|problem|not working|doesn't|does not|keeps?|stuck|hangs?|wrong|incorrect|report|loading|spinner|timeout|missing|unresponsive)\b|\b(?:404|500)\b",
        data.message, re.I,
    )
    ai_response = await get_ai_response(
        data.message, data.project_id, project_context, structured_report=bool(issue_words)
    )

    generated_report = None
    if project and issue_words and not ai_response.startswith("AI is not available:"):
        report_data = _parse_generated_report(ai_response, data.message)
        generated_report = BugReport(
            project_id=project.id,
            title=report_data["title"],
            description=report_data["description"],
            severity=report_data["severity"],
            reported_by=current_user.id,
        )
        db.add(generated_report)
        db.flush()
    
    # Save user message
    user_message = ChatMessage(
        sender_id=current_user.id,
        message=data.message,
        is_ai=False
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Save AI response
    ai_message = ChatMessage(
        sender_id=current_user.id,  # AI responses are associated with the user
        message=ai_response,
        is_ai=True
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    if generated_report:
        db.refresh(generated_report)
        ai_message.message = (
            f"Bug report saved (#{generated_report.id}).\n\n"
            f"Title: {generated_report.title}\nSeverity: {generated_report.severity.title()}\n\n"
            f"{generated_report.description}"
        )
        db.commit()
        db.refresh(ai_message)

    return AIChatOut(
        id=ai_message.id,
        sender_id=ai_message.sender_id,
        message=ai_message.message,
        is_ai=ai_message.is_ai,
        created_at=ai_message.created_at,
        generated_report=BugReportOut.model_validate(generated_report) if generated_report else None,
    )


def _parse_generated_report(response: str, issue: str) -> dict:
    """Bound and normalize model output into a short report that is safe to persist."""
    match = re.search(r"\{[\s\S]*\}", response)
    try:
        data = json.loads(match.group(0)) if match else {}
    except (json.JSONDecodeError, TypeError):
        data = {}

    def clean(value, limit):
        if isinstance(value, list):
            value = "\n".join(str(item) for item in value[:3] if isinstance(item, (str, int, float)))
        if not isinstance(value, str):
            return ""
        lines = []
        seen = set()
        for line in value.splitlines():
            line = " ".join(line.strip().split())
            key = line.casefold()
            if line and key not in seen:
                lines.append(line)
                seen.add(key)
        return " ".join(lines)[:limit].strip()

    title = clean(data.get("title"), 200) or clean(issue, 120)
    severity = clean(data.get("severity"), 20).lower()
    if severity not in {"low", "medium", "high", "critical"}:
        severity = "medium"
    sections = [
        ("Affected area", clean(data.get("affected_area"), 180)),
        ("Description", clean(data.get("description"), 500)),
        ("Steps to reproduce", clean(data.get("steps"), 500)),
        ("Expected", clean(data.get("expected"), 180)),
        ("Actual", clean(data.get("actual"), 180)),
        ("Evidence", clean(data.get("evidence"), 300)),
    ]
    body = "\n".join(f"{label}: {value}" for label, value in sections if value)
    if not body:
        body = f"Reported issue: {clean(issue, 1000)}"
    return {"title": title or "Reported project issue", "severity": severity, "description": body[:3000]}


@router.post("/", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    data: ChatMessageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a chat message related to a bug report."""
    if current_user.role not in {"qa", "developer"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bug report chat is available to QA and developers")
    if data.bug_report_id:
        # Verify bug report exists and user has access
        from ..models import BugReport
        bug_report = db.scalar(select(BugReport).where(BugReport.id == data.bug_report_id))
        if not bug_report:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Bug report not found")
        
        # QA can chat about their reports, developers about assigned ones
        if current_user.role == "qa" and bug_report.reported_by != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only chat about your bug reports")
        if current_user.role == "developer" and bug_report.assigned_to != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only chat about assigned bug reports")
    
    message = ChatMessage(
        bug_report_id=data.bug_report_id,
        sender_id=current_user.id,
        message=data.message,
        is_ai=False
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message


@router.get("/ai/history", response_model=List[ChatMessageOut])
def get_ai_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI chat history for the current user."""
    messages = db.scalars(
        select(ChatMessage)
        .where(
            ChatMessage.sender_id == current_user.id,
            ChatMessage.bug_report_id.is_(None)
        )
        .order_by(ChatMessage.created_at.asc())
    ).all()
    
    return messages


@router.get("/{bug_report_id}", response_model=List[ChatMessageOut])
def get_chat_messages(
    bug_report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat messages for a bug report."""
    if current_user.role not in {"qa", "developer"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bug report chat is available to QA and developers")
    from ..models import BugReport

    bug_report = db.scalar(select(BugReport).where(BugReport.id == bug_report_id))
    if not bug_report:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bug report not found")
    if current_user.role == "qa" and bug_report.reported_by != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")
    if current_user.role == "developer" and bug_report.assigned_to != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    return db.scalars(
        select(ChatMessage)
        .where(ChatMessage.bug_report_id == bug_report_id)
        .order_by(ChatMessage.created_at.asc())
    ).all()

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Role = Literal["qa", "developer", "employer"]
Severity = Literal["low", "medium", "high", "critical"]
BugStatus = Literal["open", "in_progress", "fixed", "ready_for_qa"]


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: Role

    @field_validator("password")
    @classmethod
    def check_password_bytes(cls, v: str) -> str:
        # bcrypt only uses the first 72 bytes, so reject longer input explicitly.
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return v

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)
    role: Role | None = None  # when set, the account must have this role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: Role
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class AITestIn(BaseModel):
    prompt: str = Field(default="Reply with the single word: ready", min_length=1, max_length=500)


# Project schemas
class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    file_path: str
    uploaded_by: int
    created_at: datetime


# Bug Report schemas
class BugReportIn(BaseModel):
    project_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    severity: Severity = "medium"


class BugReportUpdate(BaseModel):
    status: BugStatus | None = None
    assigned_to: int | None = None


class BugReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    title: str
    description: str
    severity: Severity
    status: BugStatus
    reported_by: int
    assigned_to: int | None
    created_at: datetime
    updated_at: datetime


# Chat schemas
class ChatMessageIn(BaseModel):
    bug_report_id: int | None = None
    message: str = Field(min_length=1, max_length=5000)


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    bug_report_id: int | None
    sender_id: int
    message: str
    is_ai: bool
    created_at: datetime


class AIChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    project_id: int | None = None


class AIChatOut(BaseModel):
    id: int
    sender_id: int
    message: str
    is_ai: bool
    created_at: datetime
    generated_report: BugReportOut | None = None


class DirectMessageIn(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


class DirectMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sender_id: int
    recipient_id: int
    message: str
    created_at: datetime

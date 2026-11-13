import io
import zipfile
from fastapi.responses import FileResponse
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status, Form
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Project, User
from ..schemas import ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])

UPLOAD_DIR = Path("backend/data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
EXAMPLE_DIR = Path(__file__).resolve().parents[3] / "example-uploads"
EXAMPLES = {
    "simple-react-app.zip", "python-api-project.zip", "buggy-todo-react.zip",
    "node-store-api.zip", "flask-task-api.zip", "java-inventory-service.zip",
    "vanilla-js-weather.zip",
}


@router.get("/examples/{filename}")
def download_example(filename: str, _: User = Depends(get_current_user)):
    if filename not in EXAMPLES or not (EXAMPLE_DIR / filename).is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Example ZIP not found")
    return FileResponse(EXAMPLE_DIR / filename, filename=filename, media_type="application/zip")


@router.post("/upload", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def upload_project(
    file: UploadFile,
    name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a ZIP file containing a project."""
    if not file.filename or not file.filename.lower().endswith('.zip'):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only ZIP files are allowed")

    content = await file.read(50 * 1024 * 1024 + 1)
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "ZIP files must be 50 MB or smaller")

    try:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            if sum(item.file_size for item in archive.infolist()) > 100 * 1024 * 1024:
                raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "ZIP expands beyond the 100 MB limit")
            if archive.testzip() is not None:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "ZIP contains a corrupted file")
    except zipfile.BadZipFile:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid ZIP file")
    
    # Create user-specific directory
    user_dir = UPLOAD_DIR / str(current_user.id)
    user_dir.mkdir(exist_ok=True)
    
    # Save file
    safe_name = Path(file.filename).name
    file_path = user_dir / f"{int(datetime.now().timestamp())}_{safe_name}"
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    # Create project record
    project = Project(
        name=name,
        file_path=str(file_path),
        uploaded_by=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return project


@router.get("/", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all projects uploaded by the current user."""
    projects = db.scalars(
        select(Project).where(Project.uploaded_by == current_user.id)
    ).all()
    return projects


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific project."""
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.uploaded_by == current_user.id
        )
    )
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project and its file."""
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.uploaded_by == current_user.id
        )
    )
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    
    # Delete file
    file_path = Path(project.file_path)
    if file_path.exists():
        file_path.unlink()
    
    db.delete(project)
    db.commit()

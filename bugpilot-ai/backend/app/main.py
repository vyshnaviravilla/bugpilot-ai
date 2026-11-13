import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import models  # noqa: F401  (registers tables)
from .config import get_settings
from .database import Base, engine, migrate_user_roles
from .routers import ai, auth, bug_reports, chat, health, projects, roles

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("bugpilot")
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    migrate_user_roles()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (health.router, auth.router, roles.router, ai.router, projects.router, bug_reports.router, chat.router):
    app.include_router(r, prefix="/api")


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    log.exception("Unhandled error: %s", type(exc).__name__)
    return JSONResponse({"detail": "Something went wrong on the server."}, status_code=500)

"""
Seed script to create default users for BugPilot AI.
Run this script to create default QA and Developer accounts.
"""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import User
from app.security import hash_password


def seed_users():
    """Create default users if they don't exist."""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if users already exist
        existing_qa = db.scalar(
            select(User).where(User.email == "qa@example.com")
        )
        existing_dev = db.scalar(
            select(User).where(User.email == "developer@example.com")
        )
        
        if existing_qa and existing_dev:
            print("Default users already exist. No changes made.")
            return
        
        # Create QA user
        if not existing_qa:
            qa_user = User(
                name="QA Tester",
                email="qa@example.com",
                password_hash=hash_password("qa123"),
                role="qa"
            )
            db.add(qa_user)
            print("Created QA user: qa@example.com / qa123")
        
        # Create Developer user
        if not existing_dev:
            dev_user = User(
                name="Developer",
                email="developer@example.com",
                password_hash=hash_password("developer123"),
                role="developer"
            )
            db.add(dev_user)
            print("Created Developer user: developer@example.com / developer123")
        
        db.commit()
        print("Seed completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()

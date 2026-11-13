"""
Script to clear old test users with invalid email addresses.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User


def clear_old_users():
    """Delete users with bugpilot.local email addresses."""
    db: Session = SessionLocal()
    
    try:
        # Delete old users
        stmt = delete(User).where(User.email.in_(["qa@bugpilot.local", "developer@bugpilot.local"]))
        result = db.execute(stmt)
        db.commit()
        
        if result.rowcount > 0:
            print(f"Deleted {result.rowcount} old users with bugpilot.local emails")
        else:
            print("No old users found")
            
    except Exception as e:
        db.rollback()
        print(f"Error clearing old users: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    clear_old_users()

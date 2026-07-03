"""Create (or update) an admin user. There is no public registration by design.
Usage: python create_admin.py [email] [password]"""

import sys

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

DEFAULT_EMAIL = "admin@kamleshpaints.in"
DEFAULT_PASSWORD = "kamlesh-admin-123"


def main() -> None:
    email = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_EMAIL
    password = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PASSWORD
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            db.add(User(
                full_name="Administrator", email=email,
                hashed_password=hash_password(password), is_admin=True,
            ))
            print(f"Created admin {email}")
        else:
            user.hashed_password = hash_password(password)
            user.is_admin = True
            if not user.full_name:
                user.full_name = "Administrator"
            print(f"Updated password for {email}")
        db.commit()
        if password == DEFAULT_PASSWORD:
            print("WARNING: using the default dev password — change it before launch.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

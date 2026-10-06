"""Create or promote an administrator without writing credentials to .env.

Examples:
  python backend/scripts/create_admin.py --email admin@example.com --name "Project Admin"
  $env:DATABASE_URL="postgresql://..."; python backend/scripts/create_admin.py --email admin@example.com
"""

from __future__ import annotations

import argparse
import getpass
import sys
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parent))
from admin_common import connect_database, password_hash  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", default="Project Admin")
    args = parser.parse_args()
    password = getpass.getpass("Admin password (not saved): ")
    if len(password) < 8:
        raise SystemExit("Password must contain at least 8 characters.")
    connection, postgres = connect_database()
    placeholder = "%s" if postgres else "?"
    now = datetime.now(UTC).isoformat()
    email = args.email.strip().lower()
    try:
        cur = connection.cursor()
        cur.execute(f"SELECT id FROM users WHERE email={placeholder}", (email,))
        existing = cur.fetchone()
        if existing:
            cur.execute(f"""UPDATE users SET full_name={placeholder},password_hash={placeholder},
                role='admin',status='active',updated_at={placeholder} WHERE id={placeholder}""",
                        (args.name, password_hash(password), now, existing[0]))
            user_id = existing[0]
            action = "promoted/updated"
        else:
            user_id = str(uuid4())
            cur.execute(f"""INSERT INTO users(id,full_name,email,password_hash,role,status,created_at,updated_at)
                VALUES ({placeholder},{placeholder},{placeholder},{placeholder},'admin','active',{placeholder},{placeholder})""",
                        (user_id, args.name, email, password_hash(password), now, now))
            action = "created"
        connection.commit()
        print(f"Admin {action}: {email} (id={user_id})")
        return 0
    finally:
        connection.close()


if __name__ == "__main__":
    raise SystemExit(main())

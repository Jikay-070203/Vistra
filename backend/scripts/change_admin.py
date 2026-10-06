"""Change an administrator account without editing .env or source code."""

from __future__ import annotations

import argparse
import getpass
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from admin_common import connect_database, password_hash  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True, help="Current admin email")
    parser.add_argument("--new-email")
    parser.add_argument("--new-name")
    parser.add_argument("--change-password", action="store_true")
    args = parser.parse_args()
    if not any((args.new_email, args.new_name, args.change_password)):
        raise SystemExit("Provide --new-email, --new-name or --change-password.")
    new_password = getpass.getpass("New admin password (not saved): ") if args.change_password else None
    if new_password is not None and len(new_password) < 8:
        raise SystemExit("Password must contain at least 8 characters.")
    connection, postgres = connect_database()
    placeholder = "%s" if postgres else "?"
    try:
        cur = connection.cursor()
        cur.execute(f"SELECT id FROM users WHERE email={placeholder} AND role IN ('admin','staff')", (args.email.lower(),))
        user = cur.fetchone()
        if not user:
            raise SystemExit("Admin/staff account not found.")
        updates, values = [], []
        if args.new_email:
            updates.append(f"email={placeholder}"); values.append(args.new_email.lower())
        if args.new_name:
            updates.append(f"full_name={placeholder}"); values.append(args.new_name)
        if new_password is not None:
            updates.append(f"password_hash={placeholder}"); values.append(password_hash(new_password))
        updates.append(f"updated_at={placeholder}"); values.append(datetime.now(UTC).isoformat())
        values.append(user[0])
        cur.execute(f"UPDATE users SET {','.join(updates)} WHERE id={placeholder}", tuple(values))
        connection.commit()
        print(f"Admin updated: id={user[0]}")
        return 0
    finally:
        connection.close()


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Command Guard Hook for Antigravity.
Auto-allows safe commands, but requires manual confirmation ('force_ask')
for any command involving deletion or destructive operations.
"""
import sys
import json
import re

def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
    except Exception:
        data = {}

    tool_call = data.get("toolCall", {})
    args = tool_call.get("args", {})
    cmd = args.get("CommandLine", "") or args.get("commandLine", "") or args.get("cmd", "")
    cmd_clean = cmd.strip()

    delete_patterns = [
        r'(?:^|[;&|`\(\)]|\s)(?:del|erase|rm|rmdir|rd|unlink|shred|Remove-Item|ri|Clear-Content)(?:\.exe)?(?:\s+|$)',
        r'\bgit\s+(?:clean\b|reset\s+--hard\b|branch\s+-[dD]\b|push\s+.*--delete\b|stash\s+(?:drop|clear)\b)',
        r'\bdocker\s+(?:rm\b|rmi\b|system\s+prune\b|volume\s+rm\b)',
        r'\b(?:drop\s+(?:table|database|schema)|truncate\s+(?:table)?|delete\s+from)\b',
    ]

    is_delete = False
    matched_pattern = ""
    for pattern in delete_patterns:
        m = re.search(pattern, cmd_clean, re.IGNORECASE)
        if m:
            is_delete = True
            matched_pattern = m.group(0).strip()
            break

    if is_delete:
        response = {
            "decision": "force_ask",
            "reason": f"Phát hiện thao tác xóa dữ liệu ('{matched_pattern}'). Cần xác nhận thủ công từ người dùng để đảm bảo an toàn."
        }
    else:
        response = {
            "decision": "allow",
            "reason": "Lệnh an toàn (không có hành vi xóa). Tự động cho phép thực thi."
        }

    print(json.dumps(response, ensure_ascii=False))

if __name__ == "__main__":
    main()

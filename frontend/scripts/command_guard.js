#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
/**
 * Command Guard Hook for Antigravity (Node.js runtime).
 * Auto-allows safe commands, but requires manual confirmation ('force_ask')
 * for any command involving deletion or destructive operations.
 */
const fs = require('fs');

function main() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf-8');
  } catch (e) {
    raw = '';
  }

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch (e) {
    data = {};
  }

  const toolCall = data.toolCall || {};
  const args = toolCall.args || {};
  const cmd = (args.CommandLine || args.commandLine || args.cmd || '').trim();

  const deletePatterns = [
    /(?:^|[;&|`\(\)]|\s)(?:del|erase|rm|rmdir|rd|unlink|shred|Remove-Item|ri|Clear-Content)(?:\.exe)?(?:\s+|$)/i,
    /\bgit\s+(?:clean\b|reset\s+--hard\b|branch\s+-[dD]\b|push\s+.*--delete\b|stash\s+(?:drop|clear)\b)/i,
    /\bdocker\s+(?:rm\b|rmi\b|system\s+prune\b|volume\s+rm\b)/i,
    /\b(?:drop\s+(?:table|database|schema)|truncate\s+(?:table)?|delete\s+from)\b/i,
  ];

  let isDelete = false;
  let matchedPattern = '';
  for (const pattern of deletePatterns) {
    const match = cmd.match(pattern);
    if (match) {
      isDelete = true;
      matchedPattern = match[0].trim();
      break;
    }
  }

  let response;
  if (isDelete) {
    response = {
      decision: 'force_ask',
      reason: `Phát hiện thao tác xóa dữ liệu ('${matchedPattern}'). Cần xác nhận thủ công từ người dùng để đảm bảo an toàn.`
    };
  } else {
    response = {
      decision: 'allow',
      reason: 'Lệnh an toàn (không có hành vi xóa). Tự động cho phép thực thi.'
    };
  }

  console.log(JSON.stringify(response));
}

main();

<?php
declare(strict_types=1);

$error = null;
$rows = [];
$columns = [];
$selectedTable = $_GET['table'] ?? '';
$sql = trim($_POST['sql'] ?? '');

try {
    $databaseUrl = getenv('DATABASE_URL') ?: '';
    if ($databaseUrl === '') {
        throw new RuntimeException('DATABASE_URL is not configured. Reference the Railway Postgres service.');
    }
    $parts = parse_url($databaseUrl);
    if (!$parts || empty($parts['host'])) {
        throw new RuntimeException('Invalid PostgreSQL DATABASE_URL.');
    }
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    if (!in_array($scheme, ['postgres', 'postgresql'], true)) {
        throw new RuntimeException('DATABASE_URL must use PostgreSQL.');
    }
    $host = $parts['host'];
    $port = $parts['port'] ?? 5432;
    $name = ltrim($parts['path'] ?? '', '/');
    $user = urldecode($parts['user'] ?? '');
    $password = urldecode($parts['pass'] ?? '');
    $dsn = "pgsql:host={$host};port={$port};dbname={$name};sslmode=require";
    $db = new PDO($dsn, $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    if ($sql !== '') {
        if (!preg_match('/^(select|explain)\b/i', $sql)) {
            throw new RuntimeException('Only SELECT and EXPLAIN queries are allowed.');
        }
        $statement = $db->query($sql);
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        $columns = $rows ? array_keys($rows[0]) : [];
    } elseif ($selectedTable !== '') {
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $selectedTable)) {
            throw new RuntimeException('Invalid table name.');
        }
        $statement = $db->query('SELECT * FROM "' . $selectedTable . '" LIMIT 200');
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        $columns = $rows ? array_keys($rows[0]) : [];
    }

    $tables = $db->query("SELECT table_name AS name, 'table' AS type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
        ->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $exception) {
    $error = $exception->getMessage();
    $tables ??= [];
}

function h(mixed $value): string {
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PostgreSQL Read-only Admin</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --active-bg: #eff6ff;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }

    header {
      background: #0f172a;
      color: #fff;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    header h1 { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
    .badge { background: #1e293b; color: #94a3b8; font-size: 12px; padding: 2px 8px; border-radius: 9999px; font-weight: 500; }

    main {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 20px;
      max-width: 1600px;
      margin: 0 auto;
      padding: 20px;
      min-height: calc(100vh - 55px);
    }

    aside, section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    /* Sidebar */
    aside {
      padding: 16px;
      display: flex;
      flex-direction: column;
      height: fit-content;
      max-height: calc(100vh - 95px);
    }
    .aside-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 700;
      margin-bottom: 12px;
    }
    .table-list {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-right: 4px;
    }
    .table-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      color: var(--text);
      text-decoration: none;
      font-size: 13px;
      border-radius: 6px;
      transition: background 0.15s ease, color 0.15s ease;
      word-break: break-all;
    }
    .table-link:hover { background: #f1f5f9; color: var(--primary); }
    .table-link.active { background: var(--active-bg); color: var(--primary); font-weight: 600; }
    .table-link small { color: var(--text-muted); font-size: 11px; margin-left: 6px; }

    /* Main Section */
    section { padding: 20px; display: flex; flex-direction: column; gap: 20px; }

    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.4;
    }

    form { display: flex; flex-direction: column; gap: 8px; }
    label { font-size: 13px; font-weight: 600; color: var(--text); }
    textarea {
      width: 100%;
      height: 90px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #fafafa;
      color: #1e293b;
      resize: vertical;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    textarea:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    
    .form-footer {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    button:hover { background: var(--primary-hover); }

    .table-header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    /* Data Table */
    .table-container {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #fff;
    }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left; }
    th, td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      vertical-align: top;
      max-width: 320px;
      overflow-wrap: anywhere;
    }
    th:last-child, td:last-child { border-right: none; }
    tr:last-child td { border-bottom: none; }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      position: sticky;
      top: 0;
      white-space: nowrap;
    }
    tbody tr:hover { background: #f8fafc; }
    .muted { color: var(--text-muted); font-size: 12px; }

    @media (max-width: 840px) {
      main { grid-template-columns: 1fr; }
      aside { max-height: 250px; }
    }
  </style>
</head>
<body>
<header>
  <h1>PostgreSQL Read-only Admin</h1>
  <span class="badge">Railway Postgres</span>
</header>
<main>
  <aside>
    <div class="aside-title">Tables & Views</div>
    <div class="table-list">
      <?php foreach (($tables ?? []) as $table): ?>
        <a class="table-link <?= $selectedTable === $table['name'] ? 'active' : '' ?>" href="?table=<?=h($table['name'])?>">
          <span><?=h($table['name'])?></span>
          <small><?=h($table['type'])?></small>
        </a>
      <?php endforeach; ?>
    </div>
  </aside>

  <section>
    <?php if ($error): ?><div class="error"><?=h($error)?></div><?php endif; ?>

    <form method="post">
      <label for="sql">Query Editor</label>
      <textarea id="sql" name="sql" placeholder="SELECT * FROM table_name LIMIT 50;"><?=h($sql)?></textarea>
      <div class="form-footer">
        <button type="submit">Run Query</button>
        <span class="muted">Allowed queries: SELECT, EXPLAIN</span>
      </div>
    </form>

    <?php if ($selectedTable): ?><div class="table-header-title">Table: <?=h($selectedTable)?></div><?php endif; ?>

    <?php if ($columns): ?>
      <div class="table-container">
        <table>
          <thead>
            <tr><?php foreach ($columns as $column): ?><th><?=h($column)?></th><?php endforeach; ?></tr>
          </thead>
          <tbody>
            <?php foreach ($rows as $row): ?>
              <tr><?php foreach ($columns as $column): ?><td><?=h($row[$column])?></td><?php endforeach; ?></tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <p class="muted">Showing up to 200 rows.</p>
    <?php elseif (!$error): ?>
      <p class="muted">Select a table from the sidebar or execute a query above.</p>
    <?php endif; ?>
  </section>
</main>
</body>
</html>
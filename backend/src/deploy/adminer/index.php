<?php
declare(strict_types=1);

$dbPath = '/data/yourtripyourtry.db';
$error = null;
$rows = [];
$columns = [];
$selectedTable = $_GET['table'] ?? '';
$sql = trim($_POST['sql'] ?? '');

try {
    if (!is_file($dbPath)) {
        throw new RuntimeException('Database not found: ' . $dbPath);
    }
    $db = new PDO('sqlite:' . $dbPath, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout = 5000');

    if ($sql !== '') {
        if (!preg_match('/^(select|pragma|explain)\b/i', $sql)) {
            throw new RuntimeException('Only SELECT, PRAGMA and EXPLAIN queries are allowed.');
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

    $tables = $db->query("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name")
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
  <title>SQLite Admin</title>
  <style>
    body{font:14px system-ui;margin:0;background:#f5f7fb;color:#172033} header{background:#172033;color:white;padding:16px 24px} main{display:grid;grid-template-columns:240px 1fr;gap:20px;padding:20px} aside,section{background:white;border:1px solid #dce2ed;border-radius:8px;padding:16px} a{display:block;padding:7px 4px;color:#1558b0;text-decoration:none} a:hover{background:#eef4ff} textarea{width:100%;height:100px;font:13px monospace;box-sizing:border-box} button{margin:8px 0;padding:8px 14px;cursor:pointer} table{border-collapse:collapse;width:100%;font-size:13px} th,td{border:1px solid #dce2ed;padding:7px;text-align:left;vertical-align:top;max-width:360px;overflow-wrap:anywhere} th{background:#eef2f7}.error{color:#a40000;background:#fff0f0;padding:10px;border-radius:5px;margin-bottom:12px}.muted{color:#667085}
  </style>
</head>
<body>
<header><strong>SQLite Admin</strong> <span class="muted">/data/yourtripyourtry.db</span></header>
<main>
  <aside>
    <strong>Tables / views</strong>
    <?php foreach (($tables ?? []) as $table): ?>
      <a href="?table=<?=h($table['name'])?>"><?=h($table['name'])?> <small>(<?=h($table['type'])?>)</small></a>
    <?php endforeach; ?>
  </aside>
  <section>
    <?php if ($error): ?><div class="error"><?=h($error)?></div><?php endif; ?>
    <form method="post">
      <label for="sql"><strong>Read-only SQL</strong></label>
      <textarea id="sql" name="sql" placeholder="SELECT * FROM places LIMIT 50;"><?=h($sql)?></textarea>
      <button type="submit">Run query</button>
      <span class="muted">Allowed: SELECT, PRAGMA, EXPLAIN</span>
    </form>
    <?php if ($selectedTable): ?><h2><?=h($selectedTable)?></h2><?php endif; ?>
    <?php if ($columns): ?>
      <div style="overflow:auto"><table><thead><tr><?php foreach ($columns as $column): ?><th><?=h($column)?></th><?php endforeach; ?></tr></thead><tbody>
      <?php foreach ($rows as $row): ?><tr><?php foreach ($columns as $column): ?><td><?=h($row[$column])?></td><?php endforeach; ?></tr><?php endforeach; ?>
      </tbody></table></div>
      <p class="muted">Showing up to 200 rows.</p>
    <?php elseif (!$error): ?><p class="muted">Select a table or run a query.</p><?php endif; ?>
  </section>
</main>
</body>
</html>



<?php

header(
  "Content-Security-Policy: " .
  "default-src 'self'; " .
  "connect-src 'self' https://fox2code.com https://cdn.jsdelivr.net; " .
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " .
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
  "font-src 'self' https://fonts.gstatic.com data:; " .
  "object-src 'none'"
);

if (!isTokenValid()) {
  $newAdminToken = bin2hex(random_bytes(64));
  $currentFolder = dirname(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
  $host = explode(':', $_SERVER['HTTP_HOST'])[0];
  setcookie("admin-token", $newAdminToken, [
    'expires' => time() + 86400 * 3650,  // expire in 10 years (effectively never)
    'path' => $currentFolder,
    'domain' => $host,
    'secure'   => true,                // only over HTTPS
    'httponly' => true,                // not accessible to JS
    'samesite' => 'Strict'             // optional but recommended
  ]);
  $_COOKIE["admin-token"] = $newAdminToken;
}

function isTokenValid(): bool {
  return isset($_COOKIE["admin-token"]) && strlen($_COOKIE["admin-token"]) == 64 * 2;
}

// Use hostname as pepper to make tokens harder to reverse
$adminTokenRepresentation = hash('ripemd160',date('T') . $_COOKIE["admin-token"] . gethostname());
$csrfToken = hash('sha256', date('YmD') . $adminTokenRepresentation . gethostname());

// Check if the user is an administrator
if (!file_exists('admins.json')) {
  file_put_contents('admins.json', "{}");
}
if (!file_exists('data.json')) {
  file_put_contents('data.json', "{}");
}
if (!file_exists('posts.json')) {
  file_put_contents('posts.json', "[]");
}
$admins = json_decode(file_get_contents('admins.json'), true);
$isAdmin = isset($admins[$adminTokenRepresentation]);
$failStatus = "Unauthorized";

if ($isAdmin && file_exists('lockdown.lock')) {
  $failStatus = "Locked down";
  $isAdmin = false;
}

if (!$isAdmin) {
  http_response_code(200);
  ?>
<!DOCTYPE html>
<html id="admin-root" lang="en">
  <head>
    <title>Warzone2054 -> Admin panel</title>
    <link rel="stylesheet" href="unify.css">
    <link rel="stylesheet" href="style.css">
    <meta charset="utf-8">
    <meta name="description" content="Warzone 2054 admin panel for Last War">
    <meta name="darkreader-lock">
  </head>
  <body>
  <h1>Warzone2054 -> Admin panel!</h1>
  <p>Your user token: <code><?php echo $adminTokenRepresentation; ?></code> (Status: <?php echo $failStatus; ?>)</p><br/>
  </body>
</html>
  <?php
  exit;
}
$adminUser = $admins[$adminTokenRepresentation];
?>
<!DOCTYPE html>
<html id="admin-root" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Warzone2054 -> Admin panel</title>
  <link rel="stylesheet" href="unify.css">
  <link rel="stylesheet" href="style.css">
  <meta name="description" content="Warzone 2054 admin panel for Last War">
  <meta name="darkreader-lock">
  <script>
    window.csrfToken = "<?php echo $csrfToken; ?>";
    window.adminUser = "<?php echo $adminUser; ?>";
  </script>
  <script src="https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="popup.js"></script>
  <script src="news.js"></script>
  <script src="admin.js" defer async></script>
</head>
<body>
<h1>Warzone2054 -> Admin panel!</h1>
<p>Your user token: <code><?php echo $adminTokenRepresentation; ?></code> (Status: Admin)</p>
<div id="action-container" class="container">
  <button class="button" onclick="window.openMakeNewsPopup();">Add post</button>
  <!-- <button class="button" onclick="window.openArmsRacePopup();">Update arms race</button> -->
  <button class="button" onclick="window.openLockdownPopup();">Lockdown panel</button>
</div>
<div id="admin-posts-container" class="container">
  <label for="posts-search"></label>
  <textarea id="posts-search" class="search-bar" rows="1" placeholder="Search posts..."></textarea>
  <div>Posts:</div>
  <div id="posts-list"></div>
</div>
<div id="popup-container">
  <br/>
  <div id="popup-content" class="container"></div>
  <button id="popup-close" onclick="W2054Popup.closePopup()">✕</button>
</div>
</body>
</html>

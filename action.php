<?php
static $lastActionTime = 0;

ini_set('log_errors', 1);
ini_set('error_log', __DIR__.'/php-error.log');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  ?>
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Error</title>
    <link rel="stylesheet" href="unify.css">
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>Error</h1>
    <p>This endpoint only accepts POST requests.</p>
    <!-- <?php echo $lastActionTime ?> -->
    <a href="admin.php">Admin panel.</a>
  </body>
  </html>
<?php
  exit;
}

function markSuccess(): void {
  global $lastActionTime;
  $lastActionTime = floor(microtime(true) * 1000);
  header('Refresh: 0; url=admin.php');
}

function errorOut(string $code, string $id, string $dbg=''): never {
  http_response_code((int)$code);
  header('Content-Type: application/json');
  echo json_encode(['error' => ['code' => $code, 'id' => $id, 'debug' => $dbg]]);
  exit;
}

function isTokenValid(): bool {
  return isset($_COOKIE["admin-token"]) && strlen($_COOKIE["admin-token"]) == 64 * 2;
}

function toBoolStr(mixed $value): string {
  return $value ? "true" : "false";
}

if (!file_exists('admins.json')) {
  errorOut(500, "internal_error", "Missing core files!");
}

$actionType = strval($_POST["action-type"]);

if (!isTokenValid() || !isset($_POST["csrf-token"]) ||
  !in_array($actionType, ["lockdown", "arms-race-update", "publish-news", "delete-news"])) {
  errorOut(400, "malformed_request", "action-type: $actionType, tokenValid: " . toBoolStr(isTokenValid()));
}

$adminTokenRepresentation = hash('ripemd160',date('T') . $_COOKIE["admin-token"] . gethostname());
$expectedCsrfToken = hash('sha256', date('YmD') . $adminTokenRepresentation . gethostname());

if ($_POST["csrf-token"] !== $expectedCsrfToken) {
  errorOut(403, "invalid_csrf_token", "Expected: $expectedCsrfToken, got: " . $_POST["csrf-token"]);
}

if (file_exists('lockdown.lock')) {
  errorOut(503, "locked_down");
}

$requestTime = intval(floor(microtime(true) * 1000));

$admins = json_decode(file_get_contents('admins.json'), true);
$isAdmin = isset($admins[$adminTokenRepresentation]);
if (!$isAdmin) {
  errorOut(401, "unauthorized");
}

if ($actionType === "lockdown") {
  markSuccess();
  // If there is suspicion that an account was compromised, lock down the endpoint
  file_put_contents('lockdown.lock', "");
  exit;
}

// Data editing functions
$adminUser = $admins[$adminTokenRepresentation];
$weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
$armsRaceTimes = ["0", "4", "8", "12", "16", "20"];

function editData(string $key, callable $transformer): void {
  $data = json_decode(file_get_contents('data.json'), true);
  $currentValue = $data[$key] ?? null;
  $data[$key] = $transformer($currentValue);
  file_put_contents('data.json', json_encode($data));
}
function setData(string $key, mixed $value): void {
  $data = json_decode(file_get_contents('data.json'), true);
  $data[$key] = $value;
  file_put_contents('data.json', json_encode($data));
}

if ($actionType === "arms-race-update") {
  $armsRaceData = [];
  foreach ($weekdays as $weekday) {
    foreach ($armsRaceTimes as $armsRaceTime) {
      $key = "a" . $weekday . $armsRaceTime;
      if (!isset($_POST[$key])) {
        errorOut(400, "malformed_request", $key . " is missing");
      }
      $armsRaceData[] = intval(strval($_POST[$key]));
    }
  }
  markSuccess();
  $data = json_decode(file_get_contents('data.json'), true);
  $data["armsRace"] = $armsRaceData;
  $data["weekOfYear"] = intval(strval($_POST["weekOfYear"]));
  file_put_contents('data.json', json_encode($data));
  exit;
}

if ($actionType === "publish-news") {
  if (!isset($_POST["keywords"]) || !isset($_POST["content"])) {
    errorOut(400, "malformed_request", "keywords or content is missing");
  }
  markSuccess();
  $armsRaceData = [];
  $post = [
    "publishedAt" => intval(floor(microtime(true) * 1000)),
    "keywords" => strval($_POST["keywords"]),
    "content" => strval($_POST["content"]),
    "author" => strval($adminUser),
  ];
  $news = json_decode(file_get_contents('posts.json'), true);
  array_unshift($news, $post);
  file_put_contents('posts.json', json_encode($news));
  exit;
}

if ($actionType === "delete-news") {
  if (!isset($_POST["news-index"])) {
    errorOut(400, "malformed_request", "news-index is missing");
  }
  $newsIndex = intval(strval($_POST["news-index"]));
  $news = json_decode(file_get_contents('posts.json'), true);
  if ($newsIndex >= count($news) || $newsIndex < 0) {
    errorOut(400, "malformed_request", "news-index out of bounds");
  }
  markSuccess();
  array_splice($news, $newsIndex, 1);
  file_put_contents('posts.json', json_encode($news));
  exit;
}

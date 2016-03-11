<?php
  /**
   * Ce fichier PHP permet d'appeler les services qui se trouvent dans le
   * sous-répertoire "svc".
   * Voici les paramètres attendus :
   *   - "s" (service) : Nom du service.
   *   - "i" (input) :
   * Le retour est une chaîne de caractères qui représente, quand tout se passe bien, un JSON.
   * Si l'utilisateur n'a pas le role pour accéder à un service, le premier caractère sera un "!".
   * Tout autre exception sera précédée du caractère "#".
   */
ob_start();

// Cross Site Origin.
//header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS');
header('Access-Control-Max-Age: 900');

date_default_timezone_set("Europe/Paris");
include_once("php/db.inc");

class FatalException extends Exception {}

function fatal($code, $message="") {
  throw new FatalException($message, $code);
}

class User {
  var $user = null;

  function __construct() {
    if (isset($_SESSION["USER"])) {
      $this->user = &$_SESSION["USER"];
      if (!isset($this->user["data"])) {
        $this->user["data"] = Array();
      }
    } else {
      $this->user = null;
    }
  }

  function hasRole($role) {
    $role = strtoupper(trim($role));
    if ($role == "") return true;
    if ($this->user == null) return false;
    if (!isset($this->user["roles"])) return false;
    $roles = $this->user["roles"];
    if (!is_array($roles)) return false;
    return in_array($role, $roles);
  }

  function isLogged() {
    if ($this->user == null) return false;
    return true;
  }

  function isEnabled() {
    if (!$this->isLogged()) return false;
    if (!isset($this->user["enabled"])) return false;
    if ($this->user["enabled"]) return true;
    return false;
  }

  function getId() {
    return $this->user["id"];
  }

  function getLogin() {
    return $this->user["login"];
  }

  function getName() {
    return $this->user["name"];
  }

  /**
   * Set data attribute.
   */
  function set($key, $val) {
    $this->user["data"][$key] = $val;
  }

  function get($key) {
    if (!isset($this->user["data"][$key])) return null;
    return $this->user["data"][$key];
  }

  function save() {
    if (!$this->isLogged()) return false;

    global $DB;
    $DB->query("UPDATE " . $DB->table("user")
               . " SET data=?"
               . " WHERE id=?",
               json_encode($this->user["data"]),
               $this->user["id"]);
    return true;
  }
}




// Protection contre les modification de quotes selon la config du serveur PHP.
if (get_magic_quotes_gpc()) {
    $process = array(&$_GET, &$_POST, &$_COOKIE, &$_REQUEST);
    while (list($key, $val) = each($process)) {
        foreach ($val as $k => $v) {
            unset($process[$key][$k]);
            if (is_array($v)) {
                $process[$key][stripslashes($k)] = $v;
                $process[] = &$process[$key][stripslashes($k)];
            } else {
                $process[$key][stripslashes($k)] = stripslashes($v);
            }
        }
    }
    unset($process);
}


class SystemData {
  var $datadir = '';
  var $locks = Array();

  function SystemData($datadir) {
    $this->datadir = dirname(__file__).'/'.$datadir.'/';
    if (!file_exists($datadir)) {
      @mkdir($datadir, 0777, true);
    }
  }

  function setRoot($dir) {
    $this->datadir .= $dir . '/';
    if (!file_exists($this->datadir)) {
      @mkdir($datadir, 0777, true);
    }
  }

  function __destruct() {
    foreach ($this->locks as $key => $fd) {
      echo "Releasing lock on \"$key\" : ";
      flock($fd, LOCK_UN);
      fclose($fd);
      echo "done!\n";
    }
  }

  function lock($filename) {
    if (array_key_exists($filename, $this->locks)) {
      return;
    }

    $fd = fopen($this->getPath($filename . ".lock"), "w");
    while (!flock($fd, LOCK_EX)) {
      usleep(10000);  // sleep for 0.01 second
    }
    $this->locks[$filename] = $fd;
  }

  function unlock($filename) {
    if (array_key_exists($filename, $this->locks)) {
      flock($this->locks[$filename], LOCK_UN);
      fclose($this->locks[$filename]);
      unset($this->locks[$filename]);
    }
  }

  function mkdir($dir) {
    $dir = $this->datadir . $dir;
    if (!file_exists($dir)) {
      @mkdir($dir, 0777, true);
    }
  }

  function getPath($filename) {
    return $this->datadir . $filename;
  }

  function opendir($dir) {
    return opendir($this->datadir . $dir);
  }

  function unlink($filename) {
    return unlink($this->getPath($filename));
  }

  function saveText($filename, $data) {
    if (!file_exists($this->datadir)) {
      @mkdir($this->datadir, 0777, true);
    }
    @file_put_contents($this->datadir.$filename, $data);
  }

  function saveJSON($filename, $data) {
    if (!file_exists($this->datadir)) {
      @mkdir($this->datadir, 0777, true);
    }
    @file_put_contents($this->datadir.$filename, json_encode($data));
  }

  function loadText($filename) {
    $file = $this->datadir.$filename;
    if (file_exists($file)) {
      // L'ajout du paramètre "true" sert à s'assurer que $data
      // sera bien du type Array et non stdClass.
      $data = @file_get_contents($file);
      return $data;
    } else {
      echo "Unable to find \"$file\"!\n";
      return null;
    }
  }

  function loadJSON($filename) {
    $file = $this->datadir.$filename;
    if (file_exists($file)) {
      // L'ajout du paramètre "true" sert à s'assurer que $data
      // sera bien du type Array et non stdClass.
      $data = @json_decode(file_get_contents($file), true);
      return $data;
    } else {
      echo "Unable to find \"$file\"!\n";
      return null;
    }
  }
};


// Cette fonction permet d'éviter d'utiliser des includes
// pour chaque classe que l'on souhaite utiliser.
// Si, lors d'un new, la classe n'est pas connue alors
// l'include se fera comme spécifié dans cette fonction.
function __autoload($class_name) {
  include 'php/' . $class_name . '.php';
}

echo "<pre style='border: 1px solid black'>";
echo date("d/m/Y H:i:s");
echo " (from " . $_SERVER["REMOTE_ADDR"] . ")\n";
print_r($_REQUEST);
echo "<hr/>\n";

@session_start();

echo SID . "<br/>\n";

@$service = $_REQUEST['s'];
// Vérification de la validité du nom de service.
// Il ne doit contenir que des lettres, des chiffres et des points.
for ($i=0 ; $i<strlen($service) ; $i++) {
  $c = $service[$i];
  if ($c == '.') continue;
  if ($c >= '0' && $c <= '9') continue;
  if ($c >= 'a' && $c <= 'z') continue;
  if ($c >= 'A' && $c <= 'Z') continue;
  // On a détecté un nom de service invalide.
  die("Invalid service name: $service");
 }

// Paramètre d'entrée.
echo "Input = " . $_REQUEST['i'] . "\n";
@$input = json_decode($_REQUEST['i'], true);
/*
switch (json_last_error()) {
 case JSON_ERROR_DEPTH:
   echo ' - Profondeur maximale atteinte';
   break;
 case JSON_ERROR_STATE_MISMATCH:
   echo ' - Inadéquation des modes ou underflow';
   break;
 case JSON_ERROR_CTRL_CHAR:
   echo ' - Erreur lors du contrôle des caractères';
   break;
 case JSON_ERROR_SYNTAX:
   echo ' - Erreur de syntaxe ; JSON malformé';
   break;
 case JSON_ERROR_UTF8:
   echo ' - Caractères UTF-8 malformés, probablement une erreur d\'encodage';
   break;
 default:
   echo ' - Erreur inconnue';
   break;
}
*/
$output = Array();

// Déclarer les objets d'accès aux donées publiques et privées.

// Inclure le code du service qui doit fournir une fonction execService().
// Il doit aussi redéfinir la variable $ROLE qui donne le role nécessaire
// à l'appel de ce service. Si $ROLE est vide, tout le monde est autorisé.
$ROLE = microtime();  // Random role for security reason.
include "svc/$service.php";

$json = "null";
$user = new User();
if ($user->hasRole($ROLE)) {
  try {
    $json = json_encode(execService($input, $user));
  }
  catch (FatalException $e) {
    $json = "#" + json_encode(Array("id" => $e->getCode(),
                                      "msg" => $e->getMessage()));
  }
  catch (Exception $e) {
    echo "<pre>";
    echo $e->getMessage();
    echo "</pre>\n";
    $json = "#null";
  }
 } else {
  $json = "!" . json_encode($ROLE);
 }
// Fermer la connexion à la base de données.
$DB = null;

echo "<hr/>\n";
echo $json;
echo "</pre>";

$output = ob_get_clean();
$logfile = "pri/services.log.html";
if (file_exists($logfile)) {
  $t = time() - filemtime($logfile);
  if ($t > 15) {
    @unlink($logfile);
    file_put_contents($logfile, "<meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\" />");
  }
}
error_log($output, 3, $logfile);

// Paramètre de sortie.
echo $json;
?>

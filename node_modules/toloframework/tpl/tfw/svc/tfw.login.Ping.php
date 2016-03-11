<?php
$ROLE = "";
/**
 * Ce service ne fait rien d'autre que de renvoyer 1.
 * Mais elle permet de garder la session active.
 * Le mieux est de l'appeler toutes les 4 minutes.
 */
function execService($input) {
  if (!array_key_exists("ping", $_SESSION)) {
    $_SESSION["ping"] = 1;
  }
  $n = intVal($_SESSION["ping"]);
  $_SESSION["ping"] = $n + 1;
  return $n;
}
?>

<?php
$ROLE = "";


/**
 * Pour le détail des données stoquées sur disque et en session,
 * voir "sys.login.Challenge.php".
 *---------------------------------------------------------------
 * Ce service est appelé avec un nouveau mot de passe
 * pour l'utilisateur courant.
 */
function execService($arg) {
  global $DB;

  if (!isset($_SESSION["USER"])) return null;
  $user = intval($_SESSION["USER"]);
  if ($user < 1) return null;
  $login = $user["login"];
  $newPassword = $arg["pwd"];
  $newNickname = $arg["nck"];

  $file = $login . ".json";
  $userDef = $SYS->loadJSON($file);
  $userDef["pwd"] = $newPassword;
  $SYS->saveJSON($file, $userDef);

  return true;
}
?>
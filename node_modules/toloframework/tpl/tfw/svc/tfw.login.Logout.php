<?php
$ROLE = "";


/**
 * Pour le détail des données stoquées sur disque et en session,
 * voir "sys.login.Challenge.php".
 *---------------------------------------------------------------
 * Ce service est appelé pour déconnecter l'utilisateur courant.
 */
function execService($p, $SYS) {
  unset($_SESSION["USER"]);
  unset($_SESSION["USER:waiting"]);
  unset($_SESSION["USER:response"]);
  return true;
}
?>
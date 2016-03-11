<?php
$ROLE = "";

include_once("db.php");


/**
 * Pour le détail des données stoquées sur disque et en session,
 * voir "sys.login.Challenge.php".
 *---------------------------------------------------------------
 * Ce service est appelé avec un nouveau mot de passe
 * pour l'utilisateur courant.
 */
function execService($mail, $SYS) {
  global $DB;

  if (count(explode("@", $mail)) != 2) {
    echo "Ceci n'est pas un mail valide: \"$mail\".";
    return null;
  }
  if (strpos($mail, '/') !== false) {
    echo "Ceci n'est pas un mail valide (/) : \"$mail\".";
    return null;
  }
  if (strpos($mail, '\\') !== false) {
    echo "Ceci n'est pas un mail valide (\\) : \"$mail\".";
    return null;
  }

  $user = $DB->findUser($mail);
  if ($id) {
    // L'utilisateur existe déjà !

  }
  else {
    $user = Array("login" => $mail,
		  "roles" => Array("RUNNER"));
    $password = "";
    $letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!:-+/*.?#@";
    for ($i = 0 ; $i < 16 ; $i++) {
      $password .= substr($letters, rand(0, strlen($letters) - 1), 1);
    }
    $user["password"] = $password;
    $DB->Create("user", $user);
  }

  mail($mail, "trail-passion.net",
       "Bonjour,\n\nVous pouvez vous connecter sur le site\n"
       ."http://www.trail-passion.net\n"
       ."avec l'utilisateur\n"
       ."$mail\n"
       ."et le mot de passe\n"
       .$user["password"] . "\n\n"
       ."L'equipe de Trail-Passion vous souhaite la bienvenue !");

  return true;
}
?>
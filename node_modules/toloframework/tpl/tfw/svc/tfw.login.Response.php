<?php
$ROLE = "";

/**
 * Pour le détail des données stoquées en base et en session,
 * voir "sys.login.Challenge.php".
 *---------------------------------------------------------------
 * Ce service est appelé avec la réponse au défi précédent.
 * En retour, on retourne la liste des roles.
 * Retourne null en cas d'échec, et les données de l'utilisateur
 * si ça réussi.
 *
 * Codes d'erreurs éventuels :
 * -1 = Le challenge est faux.
 * -2 = La session n'a pas été initialisée par le Challenge (USER:waiting).
 * -3 = La session n'a pas été initialisée par le Challenge (USER:response).
 * -4 = La proposition n'a pas le bon nombre de caractères.
 * -5 = Mauvais mot de passe.
 * -6 = Compte non activé.
 */
function execService($proposal, $SYS) {
    global $USER;

    if (!is_array($proposal)) return -1;
    if (!isset($_SESSION["USER:waiting"])) return -2;
    $user = $_SESSION["USER:waiting"];
    unset($_SESSION["USER:waiting"]);
    $response = $_SESSION["USER:response"];
    unset($_SESSION["USER:response"]);
    if ($response == null) return -3;
    if (count($response) != count($proposal)) return -4;

    for ($i = 0 ; $i < count($response) ; $i++) {
        if ($response[$i] != $proposal[$i]) {
            echo "Le mot de passe n'est pas bon !\n";
            return -5;
        }
    }

    if (!isset($user["enabled"])) return -6;
    if (!$user["enabled"]) return -6;

    $USER->login($user);
    if (!isset($user["data"])) {
        $user["data"] = Array();
    }
    // On retire les informations sensibles et on renvoie les données.
    if (isset( $user["password"] )) {
        unset( $user["password"] );
    }
    return $user;
}
?>

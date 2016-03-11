<?php
$ROLE = "";

/**
 * Les données concernant un utilisateur sont stockées dans la base de données et dans une
 * un variable de session. Voici le détail de la donnée d'un utilisateur :
 *
   {
   login: "toto@yahoo.com",
   password: "bid8le",
   roles: ["USER", "ADMIN"],
   enabled: 1
   }
 * La variable de session correspondante est $_SESSION["USER"].
 * Elle existe seulement quand un utilisateur est connecté.
 *--------------------------------------------------------------------------------------
 * Ce service est appelé avec le login de l'utilisateur qui veut
 * se connecter. En retour, on renvoie un tableau de 77 nombres
 * entiers aléatoires compris entre 0 et 15 inclus.
 */
function execService($login, $SYS) {
    global $DB;
    global $USER;

    // Préparation du challenge.
    $challenge = Array();
    for ($i=0 ; $i<77 ; $i++) {
        $challenge[] = rand(0, 15);
    }

    // On se protége contre les logins mal formés.
    $login = strtr($login, Array(".." => "_", "/" => "_", "\\" => "_"));
    $user = $DB->FindUser($login);
    if (!$user) {
        // S'il n'existe pas on crée un utilisateur bidon sans aucun droit.
        echo "L'utilisateur \"$login\" n'a pas été trouvé !\n";
        $user = Array("login" => $login,
                      "password" => "!" . time(),
                      "roles" => Array());
    }
    $USER->logout();
    $_SESSION["USER:waiting"] = $user;

    // Calcul de la réponse.
    // On commence par récupérer le mot de passe.
    $pwd = $user["password"];
    $response = Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    $j = 0;
    $pass = Array();
    for ($i=0 ; $i<strlen($pwd) ; $i++) {
        $pass[] = ord($pwd{$i});
    }
    if (256 % count($pass) == 0) {
        $pass[] = 0;
    }

    for ($i=0 ; $i<256 ; $i++) {
        $response[$i % 16] ^= $i + $pass[$i % count($pass)];
        $k1 = $challenge[($j++) % count($challenge)]%16;
        $k2 = $challenge[($j++) % count($challenge)]%16;
        $k3 = $challenge[($j++) % count($challenge)]%16;
        $response[$k3] ^= ($response[$k3] + 16*$k2 + $k3)%256;
        $response[$k2] ^= ($response[$k1] + $response[$k3])%256;
    }

    $_SESSION["USER:response"] = $response;
    return $challenge;
}
?>

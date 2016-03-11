<?php
// Gestion d'un utilisateur.
class User {
    private $id = 0;
    private $data = Array();
    private $login = '';
    private $roles = Array();
    private $logged = false;


    function __construct() {
        // Récupérer l'utilisateur courant dans les variables de session.
        if (isset($_SESSION['USER'])) {
            $user = $_SESSION['USER'];
            $this->login($user);
        }
    }

    function logout() {
        unset($_SESSION["USER"]);
    }

    function login(&$user) {
        $_SESSION["USER"] = $user;
        $this->logged = false;
        if (isset($user['roles'])) {
            $roles = $user['roles'];
            if (is_array($roles)) {
                $this->id = $user['id'];
                $this->data = $user['data'];
                $this->login = $user['login'];
                $this->roles = $roles;
                $this->logged = true;
                $this->password = $user['password'];
                error_log("[User.login] Connection of: " . $this->login);
            }
        }
    }

    function getId() { return $this->id; }
    function getData() { return $this->data; }
    function getLogin() { return $this->login; }
    function getPassword() { return $this->password; }

    // @return
    // Est-ce que cet utilisateur est connecté ?
    function isLogged() {
        return $this->logged;
    }

    // @return
    // Est-ce que cet utilisateur est administrateur ?
    function isAdmin() {
        if (!$this->isLogged()) return false;
        return $this->hasRole('ADMIN');
    }

    // @return
    // Est-ce que cet utilisateur possède le role passé en argument ?
    function hasRole($role) {
        if (!$this->isLogged()) return false;
        return in_array($role, $this->roles);
    }

    function isGranted($trace, $grant) {
        // On ne peut être autorisé que si on est connecté.
        if (!$this->isLogged()) {
            error_log("[User.isGranted] Not logged!");
            return false;
        }
        if ($this->isAdmin()) return true;

        global $DB;

        // Les droits  portent sur  une trace  donnée et  couvrent un
        // période définie par un entier au format YYYYMMDD.
        $date_struct = getdate();
        $date = $date_struct['year'] * 10000 + $date_struct['mon'] * 100 + $date_struct['mday'];
        error_log("[User.isGranted] date = $date");
        $stm = $DB->query("SELECT `usr` FROM " . $DB->table("grant")
                        . " WHERE `usr`=? AND `trace`=? AND `grant`=? "
                        . "AND `start`<=? AND `end`>=?",
                          $this->getId(), $trace, $grant, $date, $date);
        if ($stm) {
            if ($stm->fetch()) {
                return true;
            }
        }
        return false;
    }
}
?>

<?php
/**
 * Cette classe permet de stoquer des données au format JSON dans une base de données.
 * Chaque donnée appartient à une catégorie et peut avoir des champs indexés.
 * Voici les tables utilisées :
 * * obj : table des objets.
 *   * obj_id : identifiant (autoincrémental).
 *   * obj_cat : nom de la catégorie (sensible à la casse).
 *   * obj_val : valeur de l'objet au format JSON.
 * * idxnum, idxchr, idxtxt : tables des index sur les objets.
 *   * obj_id : identifiant de l'objet sur lequel porte cet index.
 *   * obj_cat : nom de la catégorie (sensible à la casse).
 *   * idx_key : nom de l'attribut indexé.
 *   * idx_val : valeur de cet attribut. (le type de ce champ dépend de la table).
 *
 */
include_once("@db.cfg.inc");

class Database {
  function __construct() {
    $this->_cnx = null;
  }

  function __destruct() {
    $this->_cnx = null;
  }

  /**
   * La connexion se fait au besoin et au dernier moment.
   */
  function cnx() {
    if ($this->_cnx == null) {
      global $DB_CFG;
      try {
        $this->_cnx = new PDO('mysql:host=' . $DB_CFG["host"]
                             . ';dbname=' . $DB_CFG["name"],
                             $DB_CFG["usr"],
                             $DB_CFG["pwd"]);
        $this->_cnx->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      }
      catch (Exception $e) {
        throw new Exception("[Database::cnx]\n" . $e->getMessage());
      }
    }
    return $this->_cnx;
  }

  /**
   * Retourne le nom complet d'une table.
   * C'est-à-dire avec le préfixe.
   */
  function table($name) {
    global $DB_CFG;
    try {
      return $DB_CFG["prefix"] . $name;
    }
    catch (Exception $e) {
      throw new Exception("[Database::prepare]\n" . $e->getMessage());
    }
  }

  function lastId() {
    return $this->cnx()->lastInsertId();
  }

  function prepare($query) {
    try {
      return $this->cnx()->prepare($query);
    }
    catch (Exception $e) {
      throw new Exception("[Database::prepare]\n" . $e->getMessage());
    }
  }

  function begin() {
    try {
      $this->cnx()->beginTransaction();
    }
    catch (Exception $e) {
      throw new Exception("[Database::begin]\n" . $e->getMessage());
    }
  }

  function commit() {
    try {
      $this->cnx()->commit();
    }
    catch (Exception $e) {
      throw new Exception("[Database::commit]\n" . $e->getMessage());
    }
  }

  function rollback() {
    try {
      $this->cnx()->rollBack();
    }
    catch (Exception $e) {
      throw new Exception("[Database::rollback]\n" . $e->getMessage());
    }
  }

  function query() {
    try {
      $nbArgs = func_num_args();
      $args = func_get_args();
      $sql = $args[0];
      $stm = $this->prepare($sql);
      for ($i=1 ; $i<$nbArgs ; $i++) {
        $stm->bindValue($i, $args[$i]);
      }
      $stm->execute();
      return $stm;
    }
    catch (Exception $e) {
      throw new Exception("[Database::query] $sql\n" . $e->getMessage());
    }
  }

  /**
   * Retourne l'utilisateur sous forme de dictionnaire ou null si aucun login ne correspond.
   */
  function findUser($username) {
    try {
      $stm = $this->query("SELECT id, password, name, roles, enabled, creation, data"
                          . " FROM " . $this->table("user")
                          . " WHERE login=?",
                          $username);
      $row = $stm->fetch();
      if ($row) {
        $user = Array("id" => $row[0],
                      "login" => $username,
                      "password" => $row[1],
                      "name" => $row[2],
                      "enabled" => $row[4],
                      "creation" => $row[5]);
        $data = $row[6];
        if (!$data || $data == "") {
          $data = null;
        } else {
          $data = json_decode($data);
        }
        $user["data"] = $data;
        $roles = $row[3];
        if (!$roles || $roles == "") {
          $roles = null;
        } else {
          $roles = json_decode($roles);
        }
        $user["roles"] = $roles;
        return $user;
      }
      return null;
    }
    catch (Exception $e) {
      throw new Exception("[Database::findUser]\n" . $e->getMessage());
    }
  }
};

$DB = new Database();
?>

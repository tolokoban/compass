<?php
class File {
  function __construct($root, $type) {
    $this->root = $root;
    $this->type = $type;
  }

  function path($id, $suffix="") {
    $id = dechex($id);
    $p = "./" . $this->root . "/" . $this->type . "/";
    while (strlen($id) > 2) {
      $p .= substr($id, 0, 2) . "/";
      $id = substr($id, 2);
    }
    if ($suffix != "") {
      $suffix = "-" . $suffix;
    }
    $path = "$id$suffix.htm";
    return Array($p, $path);
  }

  function load($id) {
    $suffix = "";
    $parts = explode(":", $id);
    if (count($parts) > 1) {
      $id = $parts[0];
      $suffix = $parts[1];
    }
    $path = $this->path($id, $suffix);
    $filename = $path[0] . $path[1];
    echo "filename = $filename\n";
    if (file_exists($filename)) {
      return file_get_contents($filename);
    } else {
      return null;
    }
  }

  function save($id, $data) {
    $suffix = "";
    $parts = explode(":", $id);
    if (count($parts) > 1) {
      $id = $parts[0];
      $suffix = $parts[1];
    }
    $path = $this->path($id, $suffix);
    $folder = $path[0];
    $file = $path[1];
    if (!file_exists($folder)) {
      mkdir($folder, 0777, true);
    }
    file_put_contents($folder . $file, $data, LOCK_EX);
  }

  function delete($id, $suffix="") {
    $path = $this->path($id, $suffix);
    $filename = $path[0] . $path[1];
    if (file_exists($filename)) {
      return unlink($filename);
    } else {
      return false;
    }
  }

  function exists($id, $suffix="") {
    $path = $this->path($id, $suffix);
    $filename = $path[0] . $path[1];
    return file_exists($filename);
  }
}
?>

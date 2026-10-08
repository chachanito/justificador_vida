<?php
if (!isset($_SESSION['usuario_id']) || (($_SESSION['rol'] ?? '') !== 'admin' && !in_array('justificador_tablas', (array)($_SESSION['permisos'] ?? []), true))) {
    require __DIR__ . '/403.php';
    return;
}
require __DIR__ . '/../partials/justificador_tablas.php';
?>
<script src="public/js/vendor/xlsx-0.20.3.full.min.js" defer></script>
<script src="public/js/justificador_tablas_core.js?v=<?= filemtime(__DIR__ . '/../../public/js/justificador_tablas_core.js') ?>" defer></script>
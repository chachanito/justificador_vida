<?php
if (!isset($_SESSION['usuario_id']) || (($_SESSION['rol'] ?? '') !== 'admin' && !in_array('justificador_vida', (array)($_SESSION['permisos'] ?? []), true))) {
    require __DIR__ . '/403.php';
    return;
}
$justificadorIntegrado = true;
?>
<div class="jv-module">
    <section class="jv-heading">
        <div><h1>Justificador Vida</h1><p>Prepara texto o tablas y agrégalos al documento.</p></div>
        <span class="jv-width">75 caracteres</span>
    </section>
    <div class="jv-workspace">
    <div class="jv-editor">
    <div class="jv-tabs" role="tablist" aria-label="Tipo de contenido">
        <button type="button" class="btn btn-primary" id="jv-tab-texto" role="tab" aria-selected="true" aria-controls="jv-panel-texto" data-jv-tab="texto">Texto</button>
        <button type="button" class="btn" id="jv-tab-tabla" role="tab" aria-selected="false" aria-controls="jv-panel-tabla" data-jv-tab="tabla" tabindex="-1">Tablas</button>
    </div>
    <section id="jv-panel-texto" role="tabpanel" aria-labelledby="jv-tab-texto">
        <?php require __DIR__ . '/../partials/justificador_texto.php'; ?>
        <div class="jv-add"><button type="button" class="btn btn-primary" id="jv-add-texto" disabled>Agregar texto al documento</button></div>
    </section>
    <section id="jv-panel-tabla" role="tabpanel" aria-labelledby="jv-tab-tabla" hidden>
        <?php require __DIR__ . '/../partials/justificador_tablas.php'; ?>
        <div class="jv-add"><button type="button" class="btn btn-primary" id="jv-add-tabla" disabled>Agregar tabla al documento</button></div>
    </section>
    </div>
    <section class="glass-card jt-card jv-document">
        <div class="jt-result-head">
            <div><h2>Documento</h2><p id="jv-summary">Agrega tu primera sección.</p></div>
            <div class="jt-actions">
                <button type="button" class="btn btn-primary" id="jv-copy" disabled>Copiar</button>
                <a class="btn" id="jv-download" download="justificador_vida.txt" hidden>Descargar TXT</a>
                <button type="button" class="btn" id="jv-clear" disabled>Vaciar</button>
            </div>
        </div>
        <div id="jv-status" role="status" aria-live="polite"></div>
        <ol id="jv-blocks" class="jv-blocks" aria-label="Secciones del documento"></ol>
        <div class="jt-preview-wrap" id="jv-result" hidden><pre id="jv-preview"></pre></div>
        <p class="jt-help jv-paste-hint">Al pegar, usa Consolas o Courier New.</p>
    </section>
    </div>
</div>
<?php unset($justificadorIntegrado); ?>
<link rel="stylesheet" href="public/css/modules/justificador_tablas.css?v=<?= filemtime(__DIR__ . '/../../public/css/modules/justificador_tablas.css') ?>">
<script src="public/js/justificador_texto_core.js?v=<?= filemtime(__DIR__ . '/../../public/js/justificador_texto_core.js') ?>" defer></script>
<script src="public/js/vendor/xlsx-0.20.3.full.min.js" defer></script>
<script src="public/js/justificador_tablas_core.js?v=<?= filemtime(__DIR__ . '/../../public/js/justificador_tablas_core.js') ?>" defer></script>
<script src="public/js/modules/herramientas_justificar.js?v=<?= filemtime(__DIR__ . '/../../public/js/modules/herramientas_justificar.js') ?>" defer></script>
<script src="public/js/modules/justificador_tablas.js?v=<?= filemtime(__DIR__ . '/../../public/js/modules/justificador_tablas.js') ?>" defer></script>

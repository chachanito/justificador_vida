<?php if (empty($justificadorIntegrado)): ?>
<div class="header-module">
    <h1>📝 Justificador de Texto</h1>
    <p>Optimizado para Reportes y Formatos de 75 caracteres.</p>
</div>

<?php endif; ?>
<div class="upload-card u-max-w-800 u-mx-auto">
    <?php if (empty($justificadorIntegrado)): ?>
    <div class="upload-header">
        <div class="upload-icon">🔧</div>
        <div>
            <h3>Formateo de Textos</h3>
            <p>Pega el texto, mantendremos las viñetas y ajustaremos uniformemente los espacios a 75 caracteres.</p>
        </div>
    </div>
    <?php endif; ?>

    <form id="justificar-form" class="upload-form">
        <?php if (!empty($justificadorIntegrado)): ?>
        <?= csrf_input() ?>
        <div class="jv-file-field">
            <label for="jv-text-file">Importar PDF o Word</label>
            <input type="file" id="jv-text-file" accept=".pdf,.docx">
            <small>PDF con texto o Word .docx · Máximo 10 MB</small>
            <span id="jv-import-status" role="status" aria-live="polite"></span>
        </div>
        <?php endif; ?>
        <label for="texto" class="u-justify-label"><?= !empty($justificadorIntegrado) ? 'Texto' : 'Pega tu texto normal aquí:' ?></label>
        <textarea name="texto" id="texto" required placeholder="<?= !empty($justificadorIntegrado) ? 'Pega tus párrafos o viñetas aquí…' : 'Pega aquí tus viñetas o párrafos. Se justifican a 75 caracteres.' ?>" class="u-justify-textarea"></textarea>

        <div class="button-group u-justify-buttons">
            <button type="submit" class="btn btn-primary">
                <i>⚙️</i> Justificar Ahora
            </button>
            <?php if (!empty($justificadorIntegrado)): ?>
            <button type="button" class="btn btn-outline" id="jv-copy-texto" disabled>Copiar texto</button>
            <?php endif; ?>
            <button type="button" class="btn btn-outline" id="texto-limpiar">
                <i>🔄</i> Limpiar
            </button>
            <a href="#" id="descargar-btn" download="justificado.txt" class="u-download-link">
                <button type="button" class="btn btn-success">
                    <i>📥</i> <?= !empty($justificadorIntegrado) ? 'Descargar TXT' : 'Descargar para Bloc de Notas' ?>
                </button>
            </a>
        </div>
        <?php if (!empty($justificadorIntegrado)): ?><span id="jv-text-copy-status" role="status" aria-live="polite"></span><?php endif; ?>
    </form>

    <div id="resultado-seccion" class="u-result-wrap" <?= !empty($justificadorIntegrado) ? 'hidden' : '' ?>>
        <?php if (empty($justificadorIntegrado)): ?>
        <div class="upload-header">
            <div class="upload-icon u-icon-success">✅</div>
            <div>
                <h3>Vista Previa del Resultado</h3>
                <p>Texto encuadrado exactamente a 75 caracteres de ancho.</p>
            </div>
        </div>
        <?php endif; ?>
        <pre id="texto-justificado" class="u-result-pre"></pre>
    </div>
</div>


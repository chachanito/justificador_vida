<div class="jt-module">
    <?php if (empty($justificadorIntegrado)): ?>
    <section class="glass-card jt-card">
        <span class="jt-kicker">Herramientas · Formatos de texto</span>
        <h1>Justificador de Tablas</h1>
        <p>Convierte una tabla de Excel en texto alineado, con exactamente 75 caracteres por línea.</p>
    </section>
    <?php endif; ?>
    <div id="jt-status" role="status" aria-live="polite"></div>
    <section class="glass-card jt-card">
        <h2><?= !empty($justificadorIntegrado) ? 'Archivo y opciones' : '1. Seleccionar los datos' ?></h2>
        <label for="jt-file">Archivo Excel o CSV</label>
        <input type="file" id="jt-file" accept=".xlsx,.xls,.csv">
        <p class="jt-help"><?= !empty($justificadorIntegrado) ? 'Máximo 10 MB · 8 columnas · 3000 filas' : 'Hasta 10 MB. El archivo se procesa en este navegador. Se conservan los importes y formatos de las celdas.' ?></p>
        <div class="jt-fields">
            <div><label for="jt-sheet">Hoja</label><select id="jt-sheet" disabled><option>Selecciona un archivo</option></select></div>
            <div><label for="jt-range">Rango (opcional)</label><input id="jt-range" class="u-input" placeholder="Ejemplo: A1:D20" disabled></div>
        </div>
        <?php if (empty($justificadorIntegrado)): ?><p class="jt-help">La tabla se genera al cargar el archivo. Puedes seleccionar hasta 8 columnas y 3000 filas. Si tu hoja contiene varias tablas, indica el rango y pulsa Generar tabla.</p><?php endif; ?>
        <div class="jt-options">
            <label><input type="checkbox" id="jt-list"> Listado</label>
            <label><input type="checkbox" id="jt-header" checked> Primera fila como encabezado</label>
            <label><input type="checkbox" id="jt-bullets" checked> Viñetas en la primera columna</label>
            <label><input type="checkbox" id="jt-justify" checked> Justificar descripciones largas</label>
            <label><input type="checkbox" id="jt-lines"> Separar cada fila con una línea</label>
        </div>
        <p class="jt-help"><?= !empty($justificadorIntegrado) ? 'Listado: columna # o N° de hasta 4 caracteres.' : 'Listado: la columna # o N° ocupa 4 caracteres, sin viñetas ni espacios añadidos entre palabras. Sin encabezado, se usa la primera columna como numeración.' ?></p>
        <div class="jt-actions">
            <button type="button" id="jt-generate" class="btn btn-primary" disabled><?= !empty($justificadorIntegrado) ? 'Generar tabla' : 'Generar tabla de 75 caracteres' ?></button>
            <button type="button" id="jt-example" class="btn">Ver ejemplo de coberturas</button>
            <button type="button" id="jt-clear" class="btn">Limpiar</button>
        </div>
    </section>
    <section class="glass-card jt-card" id="jt-result" hidden>
        <div class="jt-result-head"><div><h2><?= !empty($justificadorIntegrado) ? 'Tabla preparada' : '2. Tabla lista para copiar' ?></h2><p id="jt-summary"></p></div>
            <div class="jt-actions"><button type="button" id="jt-copy" class="btn btn-primary">Copiar tabla</button><a id="jt-download" class="btn" download="tabla_75_caracteres.txt">Descargar TXT</a></div>
        </div>
        <?php if (!empty($justificadorIntegrado)): ?><details class="jv-source-preview"><summary>Ver tabla preparada</summary><?php endif; ?>
        <div class="jt-preview-wrap"><pre id="jt-preview"></pre></div>
        <?php if (!empty($justificadorIntegrado)): ?></details><?php else: ?>
        <p class="jt-help">Las descripciones continúan dentro de su columna y los importes se alinean a la derecha. Para conservar la alineación al pegar, usa Consolas o Courier New.</p>
        <?php endif; ?>
    </section>
</div>

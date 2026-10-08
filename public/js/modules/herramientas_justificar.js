(() => {
    'use strict';
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('justificar-form');
        if (!form) return;
        const input = document.getElementById('texto');
        const section = document.getElementById('resultado-seccion');
        const preview = document.getElementById('texto-justificado');
        const download = document.getElementById('descargar-btn');
        let blobUrl = null;
        function reset() {
            section.style.display = 'none';
            preview.textContent = '';
            download.style.display = 'none';
            download.removeAttribute('href');
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            blobUrl = null;
            document.dispatchEvent(new CustomEvent('justificador:texto', {detail: {text: ''}}));
        }
        form.addEventListener('submit', event => {
            event.preventDefault();
            reset();
            if (!input.value.trim()) return;
            const result = JustificadorTexto.format(input.value);
            preview.textContent = result;
            if (!section.hidden) section.style.display = 'block';
            blobUrl = URL.createObjectURL(new Blob([result], {type: 'text/plain;charset=utf-8'}));
            download.href = blobUrl;
            download.style.display = 'inline-block';
            document.dispatchEvent(new CustomEvent('justificador:texto', {detail: {text: result}}));
            if (!section.hidden) section.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        });
        input.addEventListener('input', reset);
        document.getElementById('texto-limpiar').addEventListener('click', () => {
            input.value = '';
            reset();
        });
        window.addEventListener('pagehide', () => { if (blobUrl) URL.revokeObjectURL(blobUrl); });
    });
})();

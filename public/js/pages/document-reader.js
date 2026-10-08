(() => {
    'use strict';
    // Libraries are hosted with the site. File contents never leave the browser.
    let pdfModule, mammothLoading;
    function check(signal) {
        if (signal?.aborted) throw new DOMException('Lectura cancelada.', 'AbortError');
    }
    function mammothLibrary() {
        if (!mammothLoading) mammothLoading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'public/js/vendor/mammoth.browser.js';
            script.onload = () => resolve(globalThis.mammoth);
            script.onerror = () => { script.remove(); mammothLoading = null; reject(new Error('No se pudo cargar el lector de Word. Actualiza la página.')); };
            document.head.append(script);
        });
        return mammothLoading;
    }
    async function pdfText(data, signal) {
        if (!pdfModule) pdfModule = import('../vendor/pdfjs/pdf.mjs').catch(error => { pdfModule = null; throw error; });
        const pdfjs = await pdfModule;
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.mjs', document.querySelector('script[src$="pages/document-reader.js"]').src).href;
        check(signal);
        const task = pdfjs.getDocument({ data, isEvalSupported:false });
        const abort = () => { void task.destroy(); };
        signal?.addEventListener('abort', abort, {once:true});
        try {
            const document = await task.promise;
            if (document.numPages > 300) throw new Error('El PDF supera las 300 páginas. Divide el documento antes de importarlo.');
            const pages = [];
            for (let pageNumber=1; pageNumber<=document.numPages; pageNumber++) {
                check(signal);
                const page = await document.getPage(pageNumber);
                const content = await page.getTextContent();
                const lines = [];
                let line = '', previousY = null;
                for (const item of content.items) {
                    if (typeof item.str !== 'string') continue;
                    const y = item.transform[5];
                    if (previousY !== null && Math.abs(y-previousY)>3 && line.trim()) { lines.push(line.trim()); line=''; }
                    line += (line && !/\s$/.test(line) ? ' ' : '') + item.str;
                    previousY = y;
                    if (item.hasEOL) { if (line.trim()) lines.push(line.trim()); line=''; previousY=null; }
                }
                if (line.trim()) lines.push(line.trim());
                pages.push(lines.join('\n'));
                page.cleanup();
            }
            return pages.join('\n\n');
        } finally {
            signal?.removeEventListener('abort', abort);
            await task.destroy();
        }
    }
    globalThis.JustificadorDocumento = {
        async read(file, signal) {
            check(signal);
            if (!/\.(pdf|docx)$/i.test(file.name)) throw new Error('Selecciona un PDF o Word (.docx).');
            if (file.size>10*1024*1024) throw new Error('El archivo supera los 10 MB.');
            const data = await file.arrayBuffer();
            check(signal);
            let text;
            try {
                if (/\.pdf$/i.test(file.name)) text = await pdfText(data, signal);
                else {
                    const library = await mammothLibrary();
                    check(signal);
                    text = (await library.extractRawText({arrayBuffer:data})).value;
                }
            } catch (error) {
                check(signal);
                if (error.name==='PasswordException') throw new Error('El PDF está protegido con contraseña. Importa una copia sin protección.');
                throw new Error('No se pudo leer el documento: ' + error.message);
            }
            check(signal);
            if (!text?.trim()) throw new Error('No se encontró texto. Si el PDF es escaneado, necesita OCR antes de importarlo.');
            if (text.length>2000000) throw new Error('El texto extraído es demasiado grande. Divide el documento antes de importarlo.');
            return {ok:true, texto:text.trim(), aviso:'Se extrajo el texto; revisa el orden y los saltos de línea.'};
        }
    };
})();

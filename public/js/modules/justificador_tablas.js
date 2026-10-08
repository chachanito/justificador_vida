(() => {
    'use strict';
    // El footer se ejecuta antes que los scripts defer del módulo.
    document.addEventListener('DOMContentLoaded', () => {
        const el = id => document.getElementById('jt-' + id);
        if (!el('file')) return;
        let workbook = null, example = null, blobUrl = null, filename = 'tabla';
        let loading = 0;
        function status(message, error=false) { el('status').textContent=message; el('status').dataset.error=String(error); }
        function resetResult() { el('result').hidden=true; el('preview').textContent=''; if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl=null; el('download').removeAttribute('href'); document.dispatchEvent(new CustomEvent('justificador:tabla', {detail:{text:''}})); }
        function show(result) {
            el('preview').textContent=result.text; el('result').hidden=false;
            el('summary').textContent=`${result.rows} filas · ${result.columns} columnas · ${result.lines} líneas · 75 caracteres por línea`;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            blobUrl=URL.createObjectURL(new Blob([result.text.replace(/\n/g,'\r\n')], {type:'text/plain;charset=utf-8'}));
            el('download').href=blobUrl; el('download').download=filename + '_75_caracteres.txt';
            status('Tabla generada. Puedes copiarla o descargarla.');
            document.dispatchEvent(new CustomEvent('justificador:tabla', {detail:{text:result.text}}));
        }
        function extract() {
            if (example) return example;
            const sheet=workbook.Sheets[el('sheet').value];
            const requested=el('range').value.trim().toUpperCase();
            if (requested && !/^[A-Z]{1,3}[1-9]\d*(?::[A-Z]{1,3}[1-9]\d*)?$/.test(requested)) throw new Error('Escribe un rango válido, por ejemplo A1:D20.');
            const ref=requested || sheet['!ref'];
            if (!ref) throw new Error('La hoja seleccionada no contiene datos.');
            const range=XLSX.utils.decode_range(ref);
            if (range.s.r>range.e.r || range.s.c>range.e.c || range.e.c>16383 || range.e.r>1048575) throw new Error('El rango seleccionado no es válido.');
            // Excel y CSV pueden incluir columnas vacías al final de !ref.
            // En la selección automática, cuenta únicamente hasta la última con datos.
            if (!requested) {
                let lastColumn=range.s.c;
                for (const address of Object.keys(sheet)) {
                    if (!/^[A-Z]+[1-9]\d*$/.test(address)) continue;
                    const cell=sheet[address];
                    if (!cell || (!cell.f && !String(cell.v ?? '').trim())) continue;
                    const position=XLSX.utils.decode_cell(address);
                    if (position.r>=range.s.r && position.r<=range.e.r && position.c>=range.s.c && position.c<=range.e.c) lastColumn=Math.max(lastColumn,position.c);
                }
                range.e.c=lastColumn;
            }
            if (range.e.r-range.s.r+1>3000 || range.e.c-range.s.c+1>8) throw new Error('Selecciona un rango de hasta 8 columnas y 3000 filas.');
            for (let r=range.s.r; r<=range.e.r; r++) for (let c=range.s.c; c<=range.e.c; c++) {
                const cell=sheet[XLSX.utils.encode_cell({r,c})];
                if (cell?.f && cell.v == null) throw new Error('El Excel tiene fórmulas sin resultado guardado. Ábrelo y guárdalo en Excel antes de cargarlo.');
            }
            return XLSX.utils.sheet_to_json(sheet, {header:1, raw:false, defval:'', blankrows:false, range});
        }
        function generate() {
            resetResult();
            try { show(JustificadorTablas.format(extract(), {header:el('header').checked, list:el('list').checked, bullets:el('bullets').checked, justify:el('justify').checked, rowLines:el('lines').checked})); }
            catch (error) { status(error.message,true); }
        }
        el('file').addEventListener('change', async () => {
            const version=++loading; resetResult(); workbook=null; example=null; el('generate').disabled=true; el('sheet').disabled=true; el('range').disabled=true;
            el('example').textContent='Ver ejemplo de coberturas'; el('example').disabled=false;
            const file=el('file').files[0]; if (!file) return;
            el('example').disabled=true;
            try {
                if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error('Selecciona un archivo .xlsx, .xls o .csv.');
                if (file.size>10*1024*1024) throw new Error('El archivo supera los 10 MB.');
                if (!globalThis.XLSX) throw new Error('No se pudo cargar el lector de Excel. Actualiza la página.');
                status('Leyendo archivo…');
                const data=await file.arrayBuffer(); if (version!==loading) return;
                const csv=/\.csv$/i.test(file.name);
                let content=data;
                if (csv) {
                    const bytes=new Uint8Array(data);
                    if (bytes[0]===0xff && bytes[1]===0xfe) content=new TextDecoder('utf-16le').decode(data);
                    else if (bytes[0]===0xfe && bytes[1]===0xff) content=new TextDecoder('utf-16be').decode(data);
                    else {
                        try { content=new TextDecoder('utf-8', {fatal:true}).decode(data); }
                        catch { content=new TextDecoder('windows-1252').decode(data); }
                    }
                }
                workbook=XLSX.read(content, {type:csv?'string':'array', cellText:true, cellNF:true, raw:csv});
                if (!workbook.SheetNames.length) throw new Error('El archivo no contiene hojas.');
                filename=file.name.replace(/\.[^.]+$/,'').replace(/[^\p{L}\p{N}_-]+/gu,'_');
                el('sheet').replaceChildren(...workbook.SheetNames.map(name=>new Option(name,name)));
                el('sheet').disabled=false; el('range').disabled=false; el('range').value=''; el('generate').disabled=false;
                el('example').textContent='Ver tabla del archivo';
                generate();
                if (!el('result').hidden) status('Archivo listo. Tabla generada con los datos de ' + file.name + '. Puedes copiarla o descargarla.');
            } catch (error) { if (version!==loading) return; workbook=null; status('No se pudo leer el archivo: '+error.message,true); }
            finally { if (version===loading) el('example').disabled=false; }
        });
        el('sheet').addEventListener('change', generate); el('range').addEventListener('input', resetResult);
        for (const id of ['header','list','bullets','justify','lines']) el(id).addEventListener('change', () => {
            el('bullets').disabled=el('list').checked;
            el('justify').disabled=el('list').checked;
            if (workbook || example) generate();
            else resetResult();
        });
        el('generate').addEventListener('click', generate);
        el('example').addEventListener('click', () => {
            if (workbook) { generate(); return; }
            loading++; workbook=null; el('file').value=''; el('sheet').replaceChildren(new Option('Ejemplo de coberturas','')); el('sheet').disabled=true; el('range').value=''; el('range').disabled=true; filename='ejemplo_coberturas';
            example=[['COBERTURAS','OPCIÓN BÁSICA','OPCIÓN 1','OPCIÓN 2'],['MUERTE POR CUALQUIER CAUSA','$500.00','$1,400.00','$1,800.00'],['ANTICIPO POR ENFERMEDAD TERMINAL','$250.00','$700.00','$900.00'],['MUERTE ACCIDENTAL','$500.00','$1,400.00','$1,800.00'],['INCAPACIDAD TOTAL Y PERMANENTE','$500.00','$1,400.00','$1,800.00'],['DESMEMBRACIÓN ACCIDENTAL','$500.00','$1,400.00','$1,800.00'],['GASTOS MÉDICOS POR ENFERMEDAD (CIRUGÍAS PROGRAMADAS)','$50.00','$60.00','$100.00']];
            el('generate').disabled=false; generate();
        });
        el('copy').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(el('preview').textContent); status('Tabla copiada.');
            } catch {
                const selection=window.getSelection(), range=document.createRange(); range.selectNodeContents(el('preview')); selection.removeAllRanges(); selection.addRange(range);
                status('Seleccioné la tabla. Pulsa Ctrl+C para copiarla.');
            }
        });
        el('clear').addEventListener('click', () => {
            el('example').textContent='Ver ejemplo de coberturas'; el('example').disabled=false;
            loading++; workbook=null; example=null; resetResult(); el('file').value=''; el('sheet').replaceChildren(new Option('Selecciona un archivo','')); el('sheet').disabled=true; el('range').value=''; el('range').disabled=true; el('generate').disabled=true; status('');
        });
        window.addEventListener('pagehide', () => { if (blobUrl) URL.revokeObjectURL(blobUrl); });
    });
})();

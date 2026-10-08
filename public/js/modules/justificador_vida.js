(() => {
    'use strict';
    document.addEventListener('DOMContentLoaded', () => {
        const el = id => document.getElementById('jv-' + id);
        if (!el('preview')) return;
        const blocks = [];
        const prepared = {texto:'', tabla:''};
        const textInput = document.getElementById('texto');
        const textForm = document.getElementById('justificar-form');
        let importVersion = 0, importRequest = null;
        el('text-file').addEventListener('change', async () => {
            const version = ++importVersion;
            if (importRequest) importRequest.abort();
            const file = el('text-file').files[0];
            const status = el('import-status');
            const submit = textForm.querySelector('button[type="submit"]');
            const clear = document.getElementById('texto-limpiar');
            function importedStatus(message, error=false) { status.textContent=message; status.dataset.error=String(error); }
            try {
                if (!file) { importedStatus(''); return; }
                if (!/\.(pdf|docx)$/i.test(file.name)) throw new Error('Selecciona un PDF o Word (.docx).');
                if (file.size>10*1024*1024) throw new Error('El archivo supera los 10 MB.');
                textInput.disabled=true; submit.disabled=true; clear.disabled=true; el('add-texto').disabled=true; el('copy-texto').disabled=true;
                importedStatus('Leyendo documento…');
                importRequest=new AbortController();
                let result;
                if (globalThis.JustificadorDocumento) {
                    result = await JustificadorDocumento.read(file, importRequest.signal);
                } else {
                    const data=new FormData(); data.set('archivo',file); data.set('csrf_token',textForm.elements.csrf_token.value);
                    const response=await fetch('erp/justificador_documento.php',{method:'POST',body:data,signal:importRequest.signal});
                    result=await response.json();
                    if (!response.ok) throw new Error(result.error || 'No se pudo leer el documento.');
                }
                if (version!==importVersion) return;
                if (!result.ok) throw new Error(result.error || 'No se pudo leer el documento.');
                textInput.value=result.texto;
                textInput.dispatchEvent(new Event('input', {bubbles:true}));
                importedStatus(`Texto cargado. Revísalo y pulsa Justificar Ahora.${result.aviso ? ' '+result.aviso : ''}`);
            } catch (error) {
                if (version===importVersion && error.name!=='AbortError') importedStatus(error.message, true);
            } finally {
                if (version===importVersion) {
                    textInput.disabled=false; submit.disabled=false; clear.disabled=false;
                    el('add-texto').disabled=!prepared.texto;
                    el('copy-texto').disabled=!prepared.texto;
                    importRequest=null;
                }
            }
        });
        document.getElementById('texto-limpiar').addEventListener('click', () => {
            el('text-file').value=''; el('import-status').textContent='';
        });
        let blobUrl = null;
        function message(text) { el('status').textContent = text; }
        const tabs = [...document.querySelectorAll('[data-jv-tab]')];
        function selectTab(tab) {
            for (const button of tabs) {
                const selected = button === tab;
                button.setAttribute('aria-selected', String(selected));
                button.tabIndex = selected ? 0 : -1;
                button.classList.toggle('btn-primary', selected);
                el('panel-' + button.dataset.jvTab).hidden = !selected;
            }
        }
        for (const tab of tabs) {
            tab.addEventListener('click', () => selectTab(tab));
            tab.addEventListener('keydown', event => {
                if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
                event.preventDefault();
                const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                selectTab(tabs[index]);
                tabs[index].focus();
            });
        }
        function render() {
        const text = blocks.map(block => block.text).join('\n\n');
            el('preview').textContent = text;
            el('result').hidden = !blocks.length;
            el('copy').disabled = !blocks.length;
            el('clear').disabled = !blocks.length;
            if (el('download')) el('download').hidden = !blocks.length;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            blobUrl = null;
            el('download')?.removeAttribute('href');
            if (blocks.length && el('download')) {
                blobUrl = URL.createObjectURL(new Blob([text.replace(/\n/g, '\r\n')], {type:'text/plain;charset=utf-8'}));
                el('download').href = blobUrl;
            }
            el('summary').textContent = blocks.length ? `${blocks.length} secciones · ${text.split('\n').length} líneas` : 'Agrega tu primera sección.';
            el('blocks').replaceChildren(...blocks.map((block,index) => {
                const item = document.createElement('li');
                const label = document.createElement('span');
                const description = block.text.split('\n').find(line => line.trim() && !/^-+$/.test(line)) || '';
                label.textContent = `${index+1}. ${block.type === 'texto' ? 'Texto' : 'Tabla'} · ${description.trim().slice(0,90)}`;
                label.title = label.textContent;
                const actions = document.createElement('div');
                actions.className = 'jv-block-actions';
                for (const [action,title,disabled] of [['up','Subir',index===0],['down','Bajar',index===blocks.length-1],['remove','Quitar',false]]) {
                    const button = document.createElement('button');
                    button.type = 'button'; button.className = 'btn'; button.textContent = action === 'up' ? '↑' : action === 'down' ? '↓' : '×';
                    button.title = title;
                    button.dataset.action = action; button.dataset.index = String(index); button.disabled = disabled;
                    button.setAttribute('aria-label', `${title} sección ${index+1}`);
                    actions.appendChild(button);
                }
                item.append(label,actions);
                return item;
            }));
        }
        for (const type of ['texto','tabla']) {
            document.addEventListener('justificador:' + type, event => {
                prepared[type] = event.detail.text;
                el('add-' + type).disabled = !prepared[type];
                if (type === 'texto') {
                    el('copy-texto').disabled = !prepared.texto;
                    el('text-copy-status').textContent = '';
                }
            });
            el('add-' + type).addEventListener('click', () => {
                if (!prepared[type]) return;
                blocks.push({type,text:prepared[type]});
                render();
                message(`${type === 'texto' ? 'Texto agregado' : 'Tabla agregada'} al documento. ${blocks.length} secciones.`);
            });
        }
        el('copy-texto').addEventListener('click', async () => {
            const text = prepared.texto;
            if (!text) return;
            let copied = false;
            try { await navigator.clipboard.writeText(text); copied = true; }
            catch {
                const temporary = document.createElement('textarea');
                const focused = document.activeElement;
                temporary.value = text;
                temporary.readOnly = true;
                temporary.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
                document.body.appendChild(temporary);
                try { temporary.select(); copied = document.execCommand('copy'); }
                finally { temporary.remove(); focused?.focus({preventScroll:true}); }
            }
            if (prepared.texto === text) el('text-copy-status').textContent = copied ? 'Texto justificado copiado.' : 'No se pudo copiar. Selecciona el texto preparado y pulsa Ctrl+C.';
        });
        el('blocks').addEventListener('click', event => {
            const button = event.target.closest('button[data-action]');
            if (!button || button.disabled) return;
            const index = Number(button.dataset.index);
            if (button.dataset.action === 'remove') blocks.splice(index,1);
            else {
                const target = index + (button.dataset.action === 'up' ? -1 : 1);
                [blocks[index],blocks[target]] = [blocks[target],blocks[index]];
            }
            render();
            message('Documento actualizado.');
        });
        el('clear').addEventListener('click', () => { blocks.length = 0; render(); message('Documento vacío. Puedes agregar nuevas secciones.'); });
        el('copy').addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(el('preview').textContent); message('Documento copiado.'); }
            catch {
                const selection = window.getSelection(), range = document.createRange();
                range.selectNodeContents(el('preview')); selection.removeAllRanges(); selection.addRange(range);
                message('Documento seleccionado. Pulsa Ctrl+C para copiarlo.');
            }
        });
        window.addEventListener('pagehide', () => { if (blobUrl) URL.revokeObjectURL(blobUrl); });
        render();
    });
})();

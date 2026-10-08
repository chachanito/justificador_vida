/* Formateador independiente del justificador de párrafos. Ancho total: 75. */
((root) => {
    'use strict';
    const WIDTH = 75;
    const chars = value => Array.from(String(value));
    const length = value => chars(value).length;
    const clean = value => String(value ?? '').normalize('NFC').replace(/[\r\n\t\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
    const numeric = value => /^\(?[+\-]?[$€£]?\s*\d[\d.,\s]*(?:\s*[%€$£])?\)?$/.test(value);
    function wrap(value, width, indent = 0) {
        const lines = []; let current = ''; let continuation = false;
        for (const word of value.split(/\s+/).filter(Boolean)) {
            let rest = chars(word);
            while (rest.length) {
                const prefix = continuation ? ' '.repeat(indent) : '';
                const capacity = width - prefix.length;
                const join = current ? ' ' : '';
                if (length(current) + join.length + rest.length <= capacity) {
                    current += join + rest.join(''); break;
                }
                if (current) { lines.push(prefix + current); current = ''; continuation = true; continue; }
                lines.push(prefix + rest.splice(0, capacity).join('')); continuation = true;
            }
        }
        if (current) lines.push((continuation ? ' '.repeat(indent) : '') + current);
        return lines.length ? lines : [''];
    }
    function pad(value, width, alignment) {
        const spaces = width - length(value);
        if (spaces < 0) throw new Error('Una celda excede el ancho de su columna.');
        if (alignment === 'right') return ' '.repeat(spaces) + value;
        if (alignment === 'center') return ' '.repeat(Math.floor(spaces / 2)) + value + ' '.repeat(Math.ceil(spaces / 2));
        return value + ' '.repeat(spaces);
    }
    function justify(value, width) {
        const indent = value.match(/^ */)[0];
        const words = value.trim().split(/\s+/);
        if (words.length < 2) return pad(value, width, 'left');
        const gaps = words.length - 1;
        const spaces = width - indent.length - words.reduce((sum,w) => sum + length(w), 0);
        return indent + words.map((w,i) => w + (i < gaps ? ' '.repeat(Math.floor(spaces/gaps) + (i < spaces % gaps ? 1 : 0)) : '')).join('');
    }
    function format(input, options = {}) {
        const rows = input.map(row => row.map(clean)).filter(row => row.some(Boolean));
        if (!rows.length) throw new Error('No hay datos en la hoja o rango seleccionado.');
        let columns = Math.max(...rows.map(row => row.length));
        while (columns > 1 && rows.every(row => !row[columns-1])) columns--;
        if (columns > 8) throw new Error('Selecciona un rango de hasta 8 columnas para la tabla de 75 caracteres.');
        if (rows.length > 3000) throw new Error('Selecciona un rango de hasta 3000 filas.');
        const header = options.header !== false;
        const data = rows.map(row => Array.from({length:columns}, (_,c) => row[c] || ''));
        const body = header ? data.slice(1) : data;
        const list = options.list === true;
        const numberColumn = list ? (header ? data[0].findIndex(value => /^(?:#|n\.?[°º˚o]|núm\.?|número)$/iu.test(value.replace(/\s+/g, ''))) : 0) : -1;
        if (list && numberColumn < 0) throw new Error('Para Listado, usa # o N° como encabezado de la columna de numeración.');
        if (list && body.some(row => length(row[numberColumn]) > 4)) throw new Error('La numeración del listado debe ocupar como máximo 4 caracteres.');
        if (list && columns < 2) throw new Error('Para Listado, selecciona la numeración y al menos otra columna.');
        if (!list && options.bullets !== false) for (const row of body) {
            if (row[0] && !numeric(row[0]) && !/^[-•*]\s*/.test(row[0])) row[0] = '- ' + row[0];
        }
        const right = Array.from({length:columns}, (_,c) => {
            const values = body.map(row => row[c]).filter(Boolean);
            return values.length > 0 && values.every(numeric);
        });
        const minimum = Array.from({length:columns}, (_,c) => c === numberColumn ? 4 : Math.max(6,
            ...body.map(row => numeric(row[c]) ? length(row[c]) : 0)));
        const available = WIDTH - 2 * (columns-1);
        if (minimum.reduce((a,b) => a+b, 0) > available) throw new Error('Los importes no caben completos en 75 caracteres. Selecciona menos columnas.');
        const contentLengths = minimum.map((_,c) => Math.max(0, ...(list ? body : data).map(row => length(row[c]))));
        const desired = minimum.map((min,c) => c === numberColumn ? 4 : Math.max(min, Math.min(45, contentLengths[c])));
        const flexible = Array.from({length:columns}, (_,c) => c).filter(c => c !== numberColumn);
        // El espacio sobrante va a la columna con más texto, esté donde esté.
        const extraColumn = flexible.reduce((best,c) => contentLengths[c] > contentLengths[best] ? c : best, flexible[0]);
        const widths = [...minimum];
        for (let remaining = available - widths.reduce((a,b) => a+b,0); remaining > 0; remaining--) {
            let selected = 0, score = -1;
            widths.forEach((w,c) => { if (c === numberColumn) return; const need = desired[c]-w; if (need > score) { score=need; selected=c; } });
            widths[score > 0 ? selected : extraColumn]++;
        }
        const lines = ['-'.repeat(WIDTH)];
        data.forEach((row,index) => {
            const isHeader = header && index === 0;
            const cells = row.map((value,c) => !isHeader && numeric(value) ? [value] : wrap(value, widths[c], !list && !isHeader && c === 0 && /^[-•*]/.test(value) ? 2 : 0));
            const height = Math.max(...cells.map(cell => cell.length));
            for (let line=0; line<height; line++) {
                lines.push(cells.map((cell,c) => {
                    const value = cell[line] || '';
                    if (!list && !isHeader && c === 0 && options.justify !== false && line < cell.length-1) return justify(value, widths[c]);
                    return pad(value, widths[c], c === numberColumn ? 'left' : isHeader ? 'center' : right[c] ? 'right' : 'left');
                }).join('  '));
            }
            if (isHeader || options.rowLines) lines.push('-'.repeat(WIDTH));
        });
        if (lines[lines.length-1] !== '-'.repeat(WIDTH)) lines.push('-'.repeat(WIDTH));
        if (lines.some(line => length(line) !== WIDTH)) throw new Error('No se pudo mantener el ancho de 75 caracteres.');
        return {text:lines.join('\n'), widths, rows:data.length, columns, lines:lines.length};
    }
    root.JustificadorTablas = Object.freeze({format, width:WIDTH});
})(globalThis);

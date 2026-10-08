function justificarTexto(texto, longitud = 75) {
    texto = texto.replace(/[\u201C\u201D]/g, '"')
                 .replace(/[\u2018\u2019]/g, "'")
                 .replace(/\u2013|\u2014/g, "-");

    const lineasResultado = [];
    const parrafos = texto.split("\n");

    parrafos.forEach(parrafo => {
        const textoLimpio = parrafo.trim();
        if (textoLimpio.length === 0) {
            lineasResultado.push('');
            return;
        }

        const vinetas = ['•', '-', '*', '➢', '>', 'o', 'º', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.'];
        const primerCaracter = textoLimpio.charAt(0);
        const dosPrimeros = textoLimpio.substring(0, 2);
        const tieneVineta = vinetas.includes(primerCaracter) || vinetas.includes(dosPrimeros);

        let prefijo = "";
        let sangriaEspacios = 0;

        if (tieneVineta) {
            prefijo = (vinetas.includes(dosPrimeros) ? dosPrimeros : primerCaracter) + " ";
            sangriaEspacios = prefijo.length;
        }

        const contenidoParaProcesar = tieneVineta ? textoLimpio.substring(prefijo.trim().length).trim() : textoLimpio;
        const palabras = contenidoParaProcesar.split(/\s+/);

        let lineaActual = [];
        let longitudActual = 0;
        let esPrimeraLinea = true;

        palabras.forEach((palabra) => {
            const margenDeEstaLinea = esPrimeraLinea ? prefijo.length : sangriaEspacios;
            const espaciosEntre = lineaActual.length > 0 ? lineaActual.length : 0;

            if (longitudActual + palabra.length + espaciosEntre + margenDeEstaLinea <= longitud) {
                lineaActual.push(palabra);
                longitudActual += palabra.length;
            } else {
                const inicio = esPrimeraLinea ? prefijo : " ".repeat(sangriaEspacios);
                const espacioDisponible = longitud - inicio.length;
                lineasResultado.push(inicio + distribuirEspacios(lineaActual, espacioDisponible));

                lineaActual = [palabra];
                longitudActual = palabra.length;
                esPrimeraLinea = false;
            }
        });

        if (lineaActual.length > 0) {
            const inicioUltima = esPrimeraLinea ? prefijo : " ".repeat(sangriaEspacios);
            lineasResultado.push(inicioUltima + lineaActual.join(' '));
        }
    });

    return lineasResultado.join("\n");
}

function distribuirEspacios(palabras, longitudObjetivo) {
    if (palabras.length === 1) return palabras[0];
    if (palabras.length === 0) return "";

    const totalLetras = palabras.reduce((sum, p) => sum + p.length, 0);
    const espaciosNecesarios = longitudObjetivo - totalLetras;
    const huecos = palabras.length - 1;

    const espacioBase = Math.floor(espaciosNecesarios / huecos);
    const sobrantes = espaciosNecesarios % huecos;

    let lineaFinal = "";
    for (let i = 0; i < huecos; i++) {
        lineaFinal += palabras[i];
        const espaciosDando = espacioBase + (i < sobrantes ? 1 : 0);
        lineaFinal += " ".repeat(espaciosDando);
    }
    lineaFinal += palabras[palabras.length - 1];
    return lineaFinal;
}

globalThis.JustificadorTexto = Object.freeze({format: justificarTexto, width: 75});

# Componentes de terceros

- `public/js/vendor/xlsx-0.20.3.full.min.js`: biblioteca SheetJS ya utilizada por el modulo. Se conserva su aviso de copyright en el archivo. Sitio del proveedor: https://sheetjs.com/ . Se incluye la licencia Apache 2.0 publicada por SheetJS en `public/js/vendor/LICENSE-SheetJS.txt`. Fuente: https://raw.githubusercontent.com/SheetJS/sheetjs/master/LICENSE .
- `pypdf` 6.14.2: dependencia instalada mediante `requirements.txt`; no se incluye su codigo en este paquete. Proyecto: https://pypdf.readthedocs.io/ .

Este paquete no asigna una licencia nueva al codigo propio. El titular debe elegirla si desea autorizar a terceros a reutilizarlo.

## Lectores de la version para GitHub Pages

- PDF.js / pdfjs-dist 6.4.299 (Mozilla): `public/js/vendor/pdfjs/pdf.mjs` y `pdf.worker.mjs`. Licencia Apache 2.0 incluida en `public/js/vendor/pdfjs/LICENSE`. Fuente: https://www.npmjs.com/package/pdfjs-dist/v/6.4.299 .
- Mammoth 1.13.0: `public/js/vendor/mammoth.browser.js`. Licencia BSD de dos clausulas incluida en `public/js/vendor/LICENSE-Mammoth.txt`. Fuente: https://www.npmjs.com/package/mammoth/v/1.13.0 .

Las bibliotecas se sirven con el sitio; los documentos seleccionados se leen localmente en el navegador.

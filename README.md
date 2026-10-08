# Justificador Vida

Paquete del modulo PHP Justificador Vida y sus motores compartidos de texto y tablas. Incluye el estado actual del modulo: texto de 75 caracteres, tablas Excel/CSV, numeracion de hasta cuatro caracteres en modo Listado, importacion PDF/DOCX, copia, descarga TXT y documento compuesto por secciones reordenables. Conserva los espacios entre parrafos y secciones.

## Alcance

Esta carpeta contiene el codigo del modulo para integrarlo en una aplicacion PHP. No es el ERP completo ni una aplicacion independiente con inicio de sesion. No incluye credenciales, bases de datos, documentos de usuarios, registros, respaldos ni el historial Git del ERP.

## Requisitos

- PHP 7.4 o posterior (PHP 8 recomendado), sesiones habilitadas y `proc_open` disponible.
- Python 3 y las dependencias de `requirements.txt` para importar PDF. DOCX usa bibliotecas estandar de Python.
- Navegador moderno. Excel/CSV se procesa en el navegador con SheetJS.
- Configurar PHP para aceptar cargas de al menos 10 MB (`upload_max_filesize` y `post_max_size`).

Instalar las dependencias desde esta carpeta:

```sh
python -m pip install -r requirements.txt
```

El lector busca Python en `.venv/Scripts/python.exe`, `.venv/bin/python` o en el PATH. Tambien admite la variable de entorno `PYTHON_PATH` con la ruta del ejecutable. No se necesita una base de datos para las funciones de estos justificadores.

## Integracion

1. Copiar `views`, `public` y el lector de `erp` a la aplicacion conservando las rutas. Si la aplicacion ya tiene `public/css/style.css`, combinar los estilos necesarios en lugar de reemplazar su archivo.
2. El endpoint `erp/justificador_documento.php` requiere `erp/bootstrap.php`. Usar el bootstrap de la aplicacion anfitriona para iniciar la sesion y cargar las funciones CSRF de `erp/csrf.php` (o sus equivalentes). No se incluye el bootstrap del ERP porque carga otros modulos y su configuracion.
3. Tras autenticar al usuario, la aplicacion debe proporcionar `$_SESSION['usuario_id']`, `$_SESSION['rol']` y `$_SESSION['permisos']`. El rol `admin` o el permiso `justificador_vida` da acceso al modulo y a la importacion. `justificador_tablas` da acceso a su pagina independiente. No asignar estos permisos automaticamente en un sitio publico.
4. Registrar la ruta `justificador_vida` para cargar `views/modules/justificador_vida.php`. Las otras vistas son `herramientas_justificar` y `justificador_tablas`. El anfitrion debe proporcionar una pagina `views/modules/403.php` para acceso denegado.
5. Cargar el CSS global y el CSS del modulo, y el controlador de Vida. La vista ya carga los motores compartidos, SheetJS y los controladores de texto y tablas. Ejemplo para la pagina integrada:

```html
<link rel="stylesheet" href="public/css/style.css">
<link rel="stylesheet" href="public/css/modules/justificador_vida.css">
<script src="public/js/modules/justificador_vida.js" defer></script>
```

La vista carga `justificador_tablas.css` automaticamente. Para la pagina independiente de texto, cargar tambien `public/js/modules/herramientas_justificar.js`; para tablas, cargar `public/css/modules/justificador_tablas.css` y `public/js/modules/justificador_tablas.js`.

## Limitaciones conocidas

- PDF escaneado sin capa de texto requiere OCR externo; este lector no hace OCR.
- Word debe ser `.docx`; convertir los archivos `.doc` antes de importarlos.
- Se extrae texto de PDF y Word, no se conserva su maquetacion original.
- Publicar el codigo en GitHub no ejecuta PHP/Python. GitHub Pages solo no sirve para la importacion PDF/Word; se necesita un servidor con estos interpretes.

## Publicacion

Subir solo el contenido de esta carpeta al repositorio, no la carpeta completa del ERP. Revisar `TERCEROS.md` y elegir la licencia del codigo propio antes de publicarlo. La carpeta incluye `.gitignore` para evitar incorporar documentos y configuracion local por accidente.

`MANIFIESTO.json` identifica los archivos exportados mediante SHA-256. Se mantiene la logica del modulo; en la copia del endpoint se reemplazo la ruta personal de Python por rutas portables. No se modifico la aplicacion original.

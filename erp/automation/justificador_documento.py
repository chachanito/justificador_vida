"""Extrae texto de PDF/DOCX locales; no ejecuta ni interpreta su contenido."""
import argparse
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

MAX_TEXT = 1000000
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

def read_xml(archive, name):
    info = archive.getinfo(name)
    if info.file_size > 12 * 1024 * 1024:
        raise ValueError('El contenido del Word es demasiado grande.')
    data = archive.read(info)
    if b'<!DOCTYPE' in data.upper() or b'<!ENTITY' in data.upper():
        raise ValueError('El Word contiene una estructura XML no compatible.')
    return ET.fromstring(data)

def extract_docx(path):
    with zipfile.ZipFile(path) as archive:
        root = read_xml(archive, 'word/document.xml')
        formats, definitions, starts = {}, {}, {}
        if 'word/numbering.xml' in archive.namelist():
            numbering = read_xml(archive, 'word/numbering.xml')
            for abstract in numbering.findall(W+'abstractNum'):
                abstract_id = abstract.get(W+'abstractNumId')
                for level in abstract.findall(W+'lvl'):
                    key = (abstract_id, level.get(W+'ilvl', '0'))
                    fmt, start = level.find(W+'numFmt'), level.find(W+'start')
                    formats[key] = fmt.get(W+'val', 'decimal') if fmt is not None else 'decimal'
                    starts[key] = int(start.get(W+'val', '1')) if start is not None else 1
            for number in numbering.findall(W+'num'):
                abstract = number.find(W+'abstractNumId')
                if abstract is not None: definitions[number.get(W+'numId')] = abstract.get(W+'val')
        paragraphs, counters = [], {}
        total = 0
        for paragraph in root.iter(W+'p'):
            parts = []
            for node in paragraph.iter():
                if node.tag == W+'t': parts.append(node.text or '')
                elif node.tag == W+'tab': parts.append('\t')
                elif node.tag in (W+'br', W+'cr'): parts.append('\n')
            text = ''.join(parts).strip()
            number = paragraph.find('./'+W+'pPr/'+W+'numPr/'+W+'numId')
            if text and number is not None and number.get(W+'val') != '0':
                level = paragraph.find('./'+W+'pPr/'+W+'numPr/'+W+'ilvl')
                level_id = level.get(W+'val', '0') if level is not None else '0'
                key = (number.get(W+'val'), level_id)
                definition = (definitions.get(key[0]), level_id)
                if formats.get(definition) == 'bullet': prefix = '• '
                else:
                    counters[key] = counters.get(key, starts.get(definition, 1)-1)+1
                    prefix = str(counters[key])+'. '
                text = prefix+text
            total += len(text)+2
            if total > MAX_TEXT: raise ValueError('El documento tiene demasiado texto. Divide el archivo en partes.')
            if text: paragraphs.append(text)
        return '\n\n'.join(paragraphs), None

def extract_pdf(path):
    from pypdf import PdfReader
    reader = PdfReader(path)
    if reader.is_encrypted:
        raise ValueError('El PDF está protegido. Guarda una copia sin contraseña para cargarlo.')
    if len(reader.pages) > 200:
        raise ValueError('El PDF supera las 200 páginas. Divide el archivo en partes.')
    pages, empty, total = [], 0, 0
    for page in reader.pages:
        text = (page.extract_text() or '').strip()
        if not text: empty += 1
        total += len(text)+2
        if total > MAX_TEXT: raise ValueError('El documento tiene demasiado texto. Divide el archivo en partes.')
        if text: pages.append(text)
    if not pages:
        raise ValueError('El PDF no contiene texto extraíble. Si es un escaneo, necesita reconocimiento de texto (OCR).')
    warning = f'{empty} páginas sin texto extraíble; revisa si contienen imágenes.' if empty else None
    return '\n\n'.join(pages), warning

def extract(path, kind):
    if Path(path).stat().st_size > 10*1024*1024:
        raise ValueError('El archivo supera los 10 MB.')
    text, warning = extract_pdf(path) if kind == 'pdf' else extract_docx(path)
    if not text.strip(): raise ValueError('El documento no contiene texto para importar.')
    return {'ok':True, 'texto':text, 'aviso':warning}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--archivo', required=True)
    parser.add_argument('--tipo', required=True, choices=['pdf','docx'])
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    try: result = extract(args.archivo, args.tipo)
    except ValueError as error: result = {'ok':False, 'error':str(error)}
    except ImportError: result = {'ok':False, 'error':'No está disponible el lector de PDF en el servidor.'}
    except Exception: result = {'ok':False, 'error':'No se pudo leer el documento. Comprueba que sea un PDF o Word (.docx) válido.'}
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result['ok'] else 1

if __name__ == '__main__': sys.exit(main())

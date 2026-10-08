Add-Type -AssemblyName System.IO.Compression
$fixturePath = Join-Path $PSScriptRoot 'sample.docx'
$stream = [System.IO.File]::Create($fixturePath)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
$entries = @{
 '[Content_Types].xml' = '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
 '_rels/.rels' = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
 'word/document.xml' = '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Documento Word de prueba</w:t></w:r></w:p><w:p><w:r><w:t>Segundo párrafo</w:t></w:r></w:p></w:body></w:document>'
}
try {
 foreach ($name in $entries.Keys) {
  $entry = $archive.CreateEntry($name)
  $writer = [System.IO.StreamWriter]::new($entry.Open(), [System.Text.UTF8Encoding]::new($false))
  try { $writer.Write($entries[$name]) } finally { $writer.Dispose() }
 }
} finally { $archive.Dispose(); $stream.Dispose() }

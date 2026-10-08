<?php
require_once __DIR__ . '/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
function documentoReply(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
if (!isset($_SESSION['usuario_id'])) documentoReply(['ok'=>false,'error'=>'Inicia sesión.'], 401);
if (($_SESSION['rol'] ?? '') !== 'admin' && !in_array('justificador_vida', (array)($_SESSION['permisos'] ?? []), true)) {
    documentoReply(['ok'=>false,'error'=>'No tienes permiso para este módulo.'], 403);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !validate_csrf()) documentoReply(['ok'=>false,'error'=>'Formulario inválido o sesión expirada.'], 403);
session_write_close();
set_time_limit(60);
try {
    $file = $_FILES['archivo'] ?? [];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'] ?? '')) {
        throw new InvalidArgumentException('Selecciona un archivo PDF o Word (.docx) de hasta 10 MB.');
    }
    if ($file['size'] > 10*1024*1024) throw new InvalidArgumentException('El archivo supera los 10 MB.');
    $type = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($type, ['pdf','docx'], true)) throw new InvalidArgumentException('Selecciona un PDF o Word (.docx). Para un Word .doc, guárdalo primero como .docx.');
    $root = dirname(__DIR__);
    $python = getenv('PYTHON_PATH');
    if (!$python) {
        $python = 'python';
        foreach ([$root.'/.venv/Scripts/python.exe', $root.'/.venv/bin/python'] as $candidate) {
            if (is_file($candidate)) { $python = $candidate; break; }
        }
    }
    $process = proc_open([$python,'-B',__DIR__.'/automation/justificador_documento.py','--archivo',$file['tmp_name'],'--tipo',$type], [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']], $pipes, $root, null, ['bypass_shell'=>true]);
    if (!is_resource($process)) throw new RuntimeException('No se pudo iniciar el lector de documentos.');
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], false); stream_set_blocking($pipes[2], false);
    $output = ''; $started = microtime(true); $timeout = false;
    do {
        $output .= stream_get_contents($pipes[1]);
        stream_get_contents($pipes[2]);
        $status = proc_get_status($process);
        if (!$status['running']) break;
        if (microtime(true)-$started > 45) { $timeout = true; proc_terminate($process); break; }
        usleep(50000);
    } while (true);
    $output .= stream_get_contents($pipes[1]);
    fclose($pipes[1]); fclose($pipes[2]); proc_close($process);
    if ($timeout) throw new InvalidArgumentException('El documento tardó demasiado en procesarse. Prueba con un archivo más pequeño.');
    $result = json_decode(trim($output), true);
    if (!is_array($result)) throw new RuntimeException('No se pudo procesar el documento.');
    documentoReply($result, ($result['ok'] ?? false) ? 200 : 422);
} catch (InvalidArgumentException $error) {
    documentoReply(['ok'=>false,'error'=>$error->getMessage()], 422);
} catch (Throwable $error) {
    error_log('Justificador documento: '.$error->getMessage());
    documentoReply(['ok'=>false,'error'=>'No se pudo iniciar la lectura del documento. Revisa la configuración del lector.'], 500);
}

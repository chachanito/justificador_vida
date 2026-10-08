$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot
$profilePath = Join-Path $projectRoot 'tmp/chrome-cdp'
$chromeArgs = @('--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9228', ('--user-data-dir=' + $profilePath), 'http://127.0.0.1:8087/tests/browser.html')
$chrome = Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList $chromeArgs -WindowStyle Hidden -PassThru
$socket = [System.Net.WebSockets.ClientWebSocket]::new()
try {
 $target = $null
 for ($attempt=0; $attempt -lt 15 -and -not $target; $attempt++) {
  Start-Sleep -Milliseconds 500
  try { $targets = Invoke-RestMethod 'http://127.0.0.1:9228/json'; $target = $targets | Where-Object { $_.url -like '*tests/browser.html' } | Select-Object -First 1 } catch { }
 }
 if (-not $target) { throw 'Chrome no abrió la página de prueba.' }
 $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
 $requestId = 0
 function Send-Cdp($method, $parameters) {
  $script:requestId++
  $bytes = [Text.Encoding]::UTF8.GetBytes((@{id=$script:requestId;method=$method;params=$parameters} | ConvertTo-Json -Depth 12 -Compress))
  $socket.SendAsync([ArraySegment[byte]]::new($bytes), [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  do {
   $buffer = New-Object byte[] 65536
   $message = [IO.MemoryStream]::new()
   do {
    $received = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    $message.Write($buffer, 0, $received.Count)
   } while (-not $received.EndOfMessage)
   $reply = [Text.Encoding]::UTF8.GetString($message.ToArray()) | ConvertFrom-Json
   $message.Dispose()
  } while ($reply.id -ne $script:requestId)
  if ($reply.error) { throw ($reply.error | ConvertTo-Json -Compress) }
  return $reply.result
 }
 $text = ''
 for ($attempt=0; $attempt -lt 80; $attempt++) {
  $result = Send-Cdp 'Runtime.evaluate' @{expression='document.getElementById("results").textContent';returnByValue=$true}
  $text = $result.result.value
  if ($text -match '^(PASS|FAIL)') { break }
  Start-Sleep -Milliseconds 500
 }
 Write-Output $text
 $shot = Send-Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$true}
 [IO.File]::WriteAllBytes((Join-Path $projectRoot 'tmp/browser-test.png'), [Convert]::FromBase64String($shot.data))
 if ($text -notmatch '^PASS') { throw 'Las pruebas no terminaron correctamente.' }
 $null = Send-Cdp 'Page.navigate' @{url='http://127.0.0.1:8087/'}
 Start-Sleep -Milliseconds 700
 $null = Send-Cdp 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=1;mobile=$true}
 Start-Sleep -Milliseconds 300
 $mobile = Send-Cdp 'Runtime.evaluate' @{expression='document.documentElement.scrollWidth <= innerWidth';returnByValue=$true}
 if (-not $mobile.result.value) { throw 'La página desborda el ancho del móvil.' }
 $shot = Send-Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$true}
 [IO.File]::WriteAllBytes((Join-Path $projectRoot 'tmp/mobile.png'), [Convert]::FromBase64String($shot.data))
 Write-Output 'PASS: diseño móvil sin desbordamiento horizontal'
} finally {
 $socket.Dispose()
 if (-not $chrome.HasExited) { Stop-Process -Id $chrome.Id }
}

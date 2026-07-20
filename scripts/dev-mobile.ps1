$ErrorActionPreference = 'Stop'

$toolsDirectory = Join-Path $env:LOCALAPPDATA 'tmhub-dev-tools'
$cloudflared = Join-Path $toolsDirectory 'cloudflared.exe'
$cloudflaredDownload = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'

if (-not (Test-Path -LiteralPath $cloudflared)) {
    New-Item -ItemType Directory -Force -Path $toolsDirectory | Out-Null
    Write-Host 'Preparando o acesso HTTPS para o celular (somente na primeira vez)...' -ForegroundColor Cyan
    Invoke-WebRequest -Uri $cloudflaredDownload -OutFile $cloudflared
}

$viteProcess = $null
$existingServer = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if (-not $existingServer) {
    $viteProcess = Start-Process -FilePath 'npm.cmd' `
        -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort') `
        -NoNewWindow `
        -PassThru
}
else {
    Write-Host 'Usando o servidor local que já está aberto na porta 5173.' -ForegroundColor DarkGray
}

try {
    Write-Host ''
    Write-Host 'Aguarde a URL https://...trycloudflare.com e abra-a no celular.' -ForegroundColor Green
    Write-Host 'O endereço é temporário e será encerrado com Ctrl+C.' -ForegroundColor DarkGray
    Write-Host ''
    & $cloudflared tunnel --url http://localhost:5173 --no-autoupdate
}
finally {
    if ($viteProcess -and -not $viteProcess.HasExited) {
        Stop-Process -Id $viteProcess.Id -Force
    }
}

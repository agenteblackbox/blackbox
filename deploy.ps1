param(
    [string]$Mensagem = "",
    [switch]$PularOfuscacao = $false
)

$ErrorActionPreference = "Stop"
$repo = "E:\PROJETOS CHARLES IDEIAS LAB\PROJETO BLACKBOX\landing-page-blackbox"
Set-Location $repo

Write-Host "`n== STATUS ATUAL ==" -ForegroundColor Cyan
git status

if (-not $Mensagem) {
    $Mensagem = Read-Host "`nMensagem do commit (ou Enter p/ pular)"
}

if (-not $Mensagem) {
    Write-Host "Deploy cancelado." -ForegroundColor Yellow
    exit
}

# Ofuscacao
if (-not $PularOfuscacao) {
    Write-Host "`n[Ofuscando HTMLs...]" -ForegroundColor Cyan
    node obfuscar.cjs
    if (-not $?) {
        Write-Host "[ERRO] Ofuscacao falhou. Abortando." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n[OK] Ofuscacao pulada" -ForegroundColor Yellow
}

Write-Host "`n[Comittando...]" -ForegroundColor Cyan
git add .
$diff = git diff --cached --stat
if (-not $diff) {
    Write-Host "[OK] Nada novo pra commitar. Pulando push." -ForegroundColor Yellow
    exit 0
}
git commit -m $Mensagem
if (-not $?) {
    Write-Host "[ERRO] Commit falhou." -ForegroundColor Red
    exit 1
}

Write-Host "[Enviando pra main...]" -ForegroundColor Cyan
git push origin main
if (-not $?) {
    Write-Host "[ERRO] Push pra main falhou." -ForegroundColor Red
    exit 1
}

Write-Host "[Sincronizando gh-pages...]" -ForegroundColor Cyan
git push origin main:gh-pages
if (-not $?) {
    Write-Host "[ERRO] Push pra gh-pages falhou." -ForegroundColor Red
    exit 1
}

Write-Host "`n[DEPLOY CONCLUIDO]" -ForegroundColor Green
Write-Host "https://agenteblackbox.qzz.io/" -ForegroundColor Green

Start-Sleep -Seconds 2

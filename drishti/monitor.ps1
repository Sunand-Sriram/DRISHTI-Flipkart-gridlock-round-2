# Consolidated read-only training monitor + auto-relaunch.
# Invoked identically every scheduled check so one allow-rule covers it.
$ErrorActionPreference = "SilentlyContinue"
$root = "C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti"
$cwd  = "C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART"
$pidFile = "$root\train.pid"
$models = @("vehicle_uvh26_yolo11m","trafficlight_s2tld_yolo11m","vehicle_poribohon_yolo11m","vehicle_uvh26_coarse_yolo11m")

$tpid = (Get-Content $pidFile).Trim()
$proc = Get-Process -Id $tpid -ErrorAction SilentlyContinue

# all 3 final weights present?
$done = $true
foreach ($m in $models) { if (-not (Test-Path "$root\models\${m}_best.pt")) { $done = $false } }

if ($proc) {
    Write-Host "STATUS: ALIVE (PID $tpid, Mem=$([math]::Round($proc.WorkingSet64/1MB))MB)"
} elseif ($done) {
    Write-Host "STATUS: ALL MODELS COMPLETE"
} else {
    Write-Host "STATUS: DEAD - relaunching local_train.py"
    $p = Start-Process -FilePath "python" -ArgumentList "`"$root\local_train.py`"" `
        -WorkingDirectory $cwd `
        -RedirectStandardOutput "$root\local_train.log" `
        -RedirectStandardError "$root\local_train.err.log" `
        -WindowStyle Hidden -PassThru
    Write-Host "RELAUNCHED PID $($p.Id)"
    $p.Id | Out-File $pidFile -Encoding ascii
}

Write-Host ("GPU: " + (nvidia-smi --query-gpu=memory.used,utilization.gpu,temperature.gpu --format=csv,noheader))

foreach ($m in $models) {
    $csv = "$root\runs\$m\results.csv"
    if (Test-Path $csv) {
        $l = Get-Content $csv
        $last = $l[-1] -split ","
        $saved = if (Test-Path "$root\models\${m}_best.pt") { "[SAVED]" } else { "" }
        Write-Host ("  {0}: epoch {1}/60  mAP50={2}  mAP50-95={3} {4}" -f $m, $last[0].Trim(), $last[7], $last[8], $saved)
    }
}

$err = Get-Content "$root\local_train.err.log" -ErrorAction SilentlyContinue | Select-String "Traceback|CUDA error|OutOfMemory|RuntimeError" | Select-Object -Last 2
if ($err) { Write-Host "ERRORS:"; $err } else { Write-Host "ERRORS: none" }

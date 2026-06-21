# Phone v2 monitor + auto-relaunch. Invoked identically every scheduled check.
$ErrorActionPreference = "SilentlyContinue"
$root = "C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti"
$cwd  = "C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART"
$pidFile = "$root\train_phone.pid"
$name = "phone_v2_yolo11m"

$tpid = (Get-Content $pidFile).Trim()
$proc = Get-Process -Id $tpid -ErrorAction SilentlyContinue
$flag = Test-Path "$root\models\PHONE_V2_COMPLETE.flag"

if ($proc) {
    Write-Host "STATUS: ALIVE (PID $tpid, Mem=$([math]::Round($proc.WorkingSet64/1MB))MB)"
} elseif ($flag) {
    Write-Host "STATUS: PHONE V2 COMPLETE"
} else {
    Write-Host "STATUS: DEAD - relaunching train_phone_v2.py"
    $p = Start-Process -FilePath "python" -ArgumentList "`"$root\train_phone_v2.py`"" `
        -WorkingDirectory $cwd `
        -RedirectStandardOutput "$root\train_phone.log" `
        -RedirectStandardError "$root\train_phone.err.log" `
        -WindowStyle Hidden -PassThru
    Write-Host "RELAUNCHED PID $($p.Id)"
    $p.Id | Out-File $pidFile -Encoding ascii
}

Write-Host ("GPU: " + (nvidia-smi --query-gpu=memory.used,utilization.gpu,temperature.gpu --format=csv,noheader))

$csv = "$root\runs\$name\results.csv"
if (Test-Path $csv) {
    $l = Get-Content $csv
    $last = $l[-1] -split ","
    $saved = if (Test-Path "$root\models\${name}_best.pt") { "[SAVED]" } else { "" }
    Write-Host ("  {0}: epoch {1}  mAP50={2}  mAP50-95={3} {4}" -f $name, $last[0].Trim(), $last[7], $last[8], $saved)
}

$err = Get-Content "$root\train_phone.err.log" -ErrorAction SilentlyContinue | Select-String "Traceback|CUDA error|OutOfMemory|RuntimeError" | Select-Object -Last 2
if ($err) { Write-Host "ERRORS:"; $err } else { Write-Host "ERRORS: none" }

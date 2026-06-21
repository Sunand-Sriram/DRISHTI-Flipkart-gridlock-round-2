# Track A monitor + auto-relaunch. Invoked identically every scheduled check.
$ErrorActionPreference = "SilentlyContinue"
$root = "C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti"
$cwd  = "C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART"
$pidFile = "$root\train_a.pid"
$models = @("plate_merged_yolo11m","helmet_merged_yolo11m","seatbelt_merged_yolo11m","phone_merged_yolo11m")

$tpid = (Get-Content $pidFile).Trim()
$proc = Get-Process -Id $tpid -ErrorAction SilentlyContinue
$flag = Test-Path "$root\models\TRACK_A_COMPLETE.flag"

$paused = Test-Path "$root\train_a.pause"

if ($proc) {
    Write-Host "STATUS: ALIVE (PID $tpid, Mem=$([math]::Round($proc.WorkingSet64/1MB))MB)"
} elseif ($paused) {
    Write-Host "STATUS: PAUSED (train_a.pause present) - not relaunching; dataset rebuild in progress"
} elseif ($flag) {
    Write-Host "STATUS: TRACK A COMPLETE -> ready for Track B"
} else {
    Write-Host "STATUS: DEAD - relaunching train_track_a.py"
    $p = Start-Process -FilePath "python" -ArgumentList "`"$root\train_track_a.py`"" `
        -WorkingDirectory $cwd `
        -RedirectStandardOutput "$root\train_a.log" `
        -RedirectStandardError "$root\train_a.err.log" `
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
        Write-Host ("  {0}: epoch {1}  mAP50={2}  mAP50-95={3} {4}" -f $m, $last[0].Trim(), $last[7], $last[8], $saved)
    }
}

$err = Get-Content "$root\train_a.err.log" -ErrorAction SilentlyContinue | Select-String "Traceback|CUDA error|OutOfMemory|RuntimeError" | Select-Object -Last 2
if ($err) { Write-Host "ERRORS:"; $err } else { Write-Host "ERRORS: none" }

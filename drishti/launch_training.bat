@echo off
REM Fully detached training launcher — not killed when terminal/Claude closes.
REM Logs go to drishti\training.log

set ROOT=%~dp0
set LOG=%ROOT%training.log
set PYTHON=python

echo [%DATE% %TIME%] Launcher started >> "%LOG%"

REM Kill any existing train process
taskkill /F /IM python.exe /FI "WINDOWTITLE eq drishti_train" 2>nul

REM Start training in a truly detached new window (survives terminal close)
START "drishti_train" /MIN cmd /C "%PYTHON% "%ROOT%train_all.py" >> "%LOG%" 2>&1"

echo [%DATE% %TIME%] Training started. Log: %LOG%
echo Check progress: type "%LOG%"

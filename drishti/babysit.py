"""Babysitter for train_all.py orchestrator. Runs continuously, checks every 30s,
auto-restarts if it dies, and logs all issues.
"""
import subprocess
import time
import psutil
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent
MODELS = ROOT / "models"
RUNS = ROOT / "runs"
LOG = ROOT / "babysit.log"

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def get_gpu_status():
    try:
        import torch
        if not torch.cuda.is_available():
            return None
        allocated = torch.cuda.memory_allocated() / 1e9
        reserved = torch.cuda.memory_reserved() / 1e9
        return {"allocated_gb": allocated, "reserved_gb": reserved}
    except Exception as e:
        return {"error": str(e)}

def get_latest_epoch():
    """Read current epoch from latest active training run"""
    # Check all job patterns
    patterns = ["vehicle_poribohon*", "trafficlight_*", "vehicle_uvh26*", "plate_*"]
    latest_run = None
    latest_time = 0

    for pattern in patterns:
        for run in RUNS.glob(pattern):
            if run.stat().st_mtime > latest_time:
                latest_time = run.stat().st_mtime
                latest_run = run

    if not latest_run:
        return None, None

    csv = latest_run / "results.csv"
    if csv.exists():
        with open(csv) as f:
            lines = f.readlines()
            if len(lines) > 1:
                try:
                    epoch = int(lines[-1].split(",")[0])
                    return epoch, latest_run.name
                except:
                    return None, None
    return None, None

def orchestrator_alive():
    """Check if train_all.py process is running"""
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            if "train_all.py" in " ".join(proc.info["cmdline"] or []):
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return False

def start_orchestrator():
    """Launch train_all.py"""
    try:
        cwd = ROOT.parent  # FLIPKART dir
        proc = subprocess.Popen(
            ["python", "drishti/train_all.py"],
            cwd=str(cwd),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        log(f"[START] orchestrator pid={proc.pid}")
        return True
    except Exception as e:
        log(f"[ERROR] failed to start orchestrator: {e}")
        return False

def main():
    log("=== BABYSITTER STARTED ===")
    last_epoch = None
    stale_count = 0

    while True:
        alive = orchestrator_alive()
        epoch, job_name = get_latest_epoch()
        gpu = get_gpu_status()

        gpu_str = f"GPU {gpu.get('allocated_gb', 0):.1f}GB" if gpu and "allocated_gb" in gpu else "GPU idle"
        status = f"alive={alive}, {job_name or '(waiting)'} epoch={epoch or '?'}, {gpu_str}"
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {status}")

        # Auto-restart if dead
        if not alive:
            log(f"[ALERT] orchestrator died! Restarting...")
            start_orchestrator()
            time.sleep(5)
            continue

        # Detect staleness (epoch hasn't changed for 15 checks = 450 seconds)
        if epoch == last_epoch and epoch is not None:
            stale_count += 1
            if stale_count >= 15:
                log(f"[ALERT] STALLED at epoch {epoch} ({job_name}) for 450s! Restarting...")
                # Kill and restart
                for proc in psutil.process_iter(["cmdline"]):
                    try:
                        if "train_all.py" in " ".join(proc.info["cmdline"] or []):
                            proc.kill()
                    except:
                        pass
                start_orchestrator()
                stale_count = 0
                time.sleep(5)
                continue
        else:
            stale_count = 0
            last_epoch = epoch

        # Detect OOM
        if gpu and "allocated_gb" in gpu:
            if gpu["allocated_gb"] > 7.8:
                log(f"[WARN] GPU near-full: {gpu['allocated_gb']:.2f} GB allocated")

        time.sleep(30)

if __name__ == "__main__":
    main()

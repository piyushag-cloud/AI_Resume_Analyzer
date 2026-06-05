import subprocess
import os

cwd = r"c:\Users\ASUS\.gemini\antigravity-ide\scratch\AI-Resume-Analyzer"
out_file = os.path.join(cwd, "git_out.txt")

with open(out_file, "w", encoding="utf-8") as f:
    def run_cmd(args):
        f.write(f"Running: {' '.join(args)}\n")
        res = subprocess.run(args, cwd=cwd, capture_output=True, text=True, shell=True)
        f.write("STDOUT:\n")
        f.write(res.stdout + "\n")
        f.write("STDERR:\n")
        f.write(res.stderr + "\n")
        f.write(f"Exit code: {res.returncode}\n")
        f.write("-" * 40 + "\n")

    f.write("--- Git Diagnostics ---\n")
    run_cmd(["git", "--version"])
    run_cmd(["git", "status"])
    run_cmd(["git", "remote", "-v"])
    run_cmd(["git", "branch", "-a"])
    run_cmd(["git", "log", "-n", "5", "--oneline"])

import subprocess
import os

cwd = r"c:\Users\ASUS\.gemini\antigravity-ide\scratch\AI-Resume-Analyzer"
out_file = os.path.join(cwd, "cmd_out.txt")

with open(out_file, "w", encoding="utf-8") as f:
    f.write("Running push.bat...\n")
    res = subprocess.run(["cmd.exe", "/c", "push.bat"], cwd=cwd, capture_output=True, text=True)
    f.write("STDOUT:\n")
    f.write(res.stdout + "\n")
    f.write("STDERR:\n")
    f.write(res.stderr + "\n")
    f.write(f"Exit code: {res.returncode}\n")
